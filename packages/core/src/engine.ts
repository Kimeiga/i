import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type {
  AnyRulePack,
  CoverageStatement,
  Finding,
  RawFinding,
  Rule,
  RuleKind,
  RuleSkip,
  ScanInput,
  ScanReport,
  SuppressedFinding,
} from './types.js'
import { domainOf } from './types.js'
import { isRuleEnabled } from './config.js'
import { compareFindings, deriveSurface, fingerprintOf, positionOf, preFingerprintKey } from './identity.js'
import { parseSuppressions, findSuppression, type SuppressionRange } from './suppressions.js'
import { contentDigest } from './canonical.js'
import { AUTOMATED_COVERAGE_NOTE, DISCLAIMER, PRODUCT_NAME, RULE_DOCS_URL } from './product.js'

export interface EngineOptions {
  toolVersion: string
  /** Injected for tests and for the API, which scans from a tarball not a disk. */
  readSource?: (relativePath: string) => Promise<string | undefined>
  repository?: string
  commit?: string
  ref?: string
  /** Called as each pack finishes, for CLI progress output. */
  onProgress?: (event: ProgressEvent) => void
  now?: () => Date
}

export type ProgressEvent =
  | { type: 'pack-start'; packId: string; kind: RuleKind }
  | { type: 'pack-skip'; packId: string; kind: RuleKind; reason: string }
  | { type: 'pack-done'; packId: string; kind: RuleKind; findings: number; durationMs: number }
  | { type: 'rule-error'; ruleId: string; error: string }

/**
 * Runs every pack against the input and assembles a report.
 *
 * Two properties this function must never violate:
 *
 * 1. A rule that throws does not fail the scan. It is recorded as a skip with
 *    the error text. A crash in one rule silently zeroing an entire CI check is
 *    worse than a missing rule, and a solo maintainer will ship a broken rule
 *    eventually.
 * 2. A layer that could not run is reported as "did not run", never as "found
 *    nothing". The distinction is the difference between evidence and a lie.
 */
export async function runScan(
  input: ScanInput,
  packs: readonly AnyRulePack[],
  options: EngineOptions,
): Promise<ScanReport> {
  const now = options.now ?? (() => new Date())
  const startedAt = now()
  const startedMs = startedAt.getTime()

  const readSource = options.readSource ?? defaultReader(input.rootDir)
  const suppressionCache = new Map<string, SuppressionRange[]>()

  const rulesRun: string[] = []
  const rulesSkipped: RuleSkip[] = []
  const raw: Array<{ rule: Rule<unknown>; finding: RawFinding }> = []
  const layers: CoverageStatement['layers'] = []

  for (const pack of packs) {
    const packStart = Date.now()
    options.onProgress?.({ type: 'pack-start', packId: pack.id, kind: pack.kind })

    const enabled = pack.rules.filter((rule) => {
      const state = isRuleEnabled(rule.id, rule.experimental, input.config)
      if (!state.enabled) {
        rulesSkipped.push({ ruleId: rule.id, reason: state.reason })
        return false
      }
      return true
    })

    if (enabled.length === 0) {
      const reason = 'all rules in this group are disabled'
      options.onProgress?.({ type: 'pack-skip', packId: pack.id, kind: pack.kind, reason })
      layers.push({ kind: pack.kind, ran: false, reason, rulesRun: 0, unitsExamined: 0, unitLabel: 'n/a' })
      continue
    }

    let created
    try {
      created = await pack.createContext(input)
    } catch (err) {
      const reason = `could not initialise: ${errorText(err)}`
      for (const rule of enabled) rulesSkipped.push({ ruleId: rule.id, reason })
      options.onProgress?.({ type: 'pack-skip', packId: pack.id, kind: pack.kind, reason })
      layers.push({ kind: pack.kind, ran: false, reason, rulesRun: 0, unitsExamined: 0, unitLabel: 'n/a' })
      continue
    }

    if (created.status === 'skipped') {
      for (const rule of enabled) rulesSkipped.push({ ruleId: rule.id, reason: created.reason })
      options.onProgress?.({ type: 'pack-skip', packId: pack.id, kind: pack.kind, reason: created.reason })
      layers.push({
        kind: pack.kind,
        ran: false,
        reason: created.reason,
        rulesRun: 0,
        unitsExamined: 0,
        unitLabel: 'n/a',
      })
      continue
    }

    let packFindings = 0
    for (const rule of enabled) {
      try {
        const found = await rule.check(created.context)
        rulesRun.push(rule.id)
        for (const finding of found) raw.push({ rule, finding })
        packFindings += found.length
      } catch (err) {
        const message = errorText(err)
        rulesSkipped.push({ ruleId: rule.id, reason: `rule threw: ${message}` })
        options.onProgress?.({ type: 'rule-error', ruleId: rule.id, error: message })
      }
    }

    layers.push({
      kind: pack.kind,
      ran: true,
      rulesRun: rulesRun.filter((id) => enabled.some((r) => r.id === id)).length,
      unitsExamined: created.units?.count ?? 0,
      unitLabel: created.units?.label ?? 'units',
    })
    options.onProgress?.({
      type: 'pack-done',
      packId: pack.id,
      kind: pack.kind,
      findings: packFindings,
      durationMs: Date.now() - packStart,
    })
  }

  // Occurrence indexes are assigned after a deterministic sort so that two runs
  // over the same code assign the same index to the same finding.
  raw.sort((a, b) => {
    const ka = preFingerprintKey(a.rule.id, a.finding.location, a.finding.evidence)
    const kb = preFingerprintKey(b.rule.id, b.finding.location, b.finding.evidence)
    if (ka !== kb) return ka < kb ? -1 : 1
    const [la, ca] = positionOf(a.finding.location)
    const [lb, cb] = positionOf(b.finding.location)
    return la - lb || ca - cb
  })

  const occurrences = new Map<string, number>()
  const findings: Finding[] = []
  const suppressed: SuppressedFinding[] = []

  for (const { rule, finding } of raw) {
    const key = preFingerprintKey(rule.id, finding.location, finding.evidence)
    const index = occurrences.get(key) ?? 0
    occurrences.set(key, index + 1)

    const complete: Finding = {
      ruleId: rule.id,
      kind: rule.kind,
      severity: finding.severity ?? rule.severity,
      title: rule.title,
      message: finding.message,
      location: finding.location,
      evidence: finding.evidence,
      help: finding.help,
      helpUrl: `${RULE_DOCS_URL}/${rule.docs}`,
      standards: [...(finding.standards ?? rule.standards)],
      fingerprint: fingerprintOf(rule.id, finding.location, finding.evidence, index),
      surface: finding.surface || deriveSurface(finding.location),
      // The boundary transition is what turns a lint error into a statement
      // about the system, and it is the whole content of the "Privacy boundary
      // changed" section. Dropping it here silently empties that section.
      boundary: finding.boundary,
    }

    const waiver = await suppressionFor(complete, readSource, suppressionCache)
    if (waiver) {
      suppressed.push({
        ruleId: complete.ruleId,
        fingerprint: complete.fingerprint,
        surface: complete.surface,
        location: complete.location,
        severity: complete.severity,
        reason: waiver.reason,
        directive: waiver.directive,
      })
      continue
    }
    findings.push(complete)
  }

  findings.sort(compareFindings)
  suppressed.sort((a, b) => a.ruleId.localeCompare(b.ruleId) || a.fingerprint.localeCompare(b.fingerprint))
  rulesRun.sort()
  rulesSkipped.sort((a, b) => a.ruleId.localeCompare(b.ruleId))

  const finishedAt = now()
  const metrics = input.buildDir ? await safeBuildMetrics(input) : {}

  const report: ScanReport = {
    schemaVersion: '1',
    tool: { name: PRODUCT_NAME, version: options.toolVersion },
    scan: {
      id: randomUUID(),
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: Math.max(0, finishedAt.getTime() - startedMs),
    },
    target: {
      rootDir: input.rootDir,
      repository: options.repository,
      commit: options.commit,
      ref: options.ref,
      urls: [...input.urls],
    },
    rulesRun,
    rulesSkipped,
    findings,
    suppressed,
    metrics,
    coverage: { layers, note: AUTOMATED_COVERAGE_NOTE },
    disclaimer: DISCLAIMER,
    contentHash: '',
  }

  report.contentHash = computeContentHash(report)
  return report
}

/** Fields that describe *what was found*, not *when* or *where from*. */
export function computeContentHash(report: ScanReport): string {
  return contentDigest({
    schemaVersion: report.schemaVersion,
    tool: report.tool,
    urls: report.target.urls,
    rulesRun: report.rulesRun,
    rulesSkipped: report.rulesSkipped,
    findings: report.findings,
    suppressed: report.suppressed,
    metrics: report.metrics,
    coverage: report.coverage,
  })
}

export function verifyContentHash(report: ScanReport): boolean {
  return computeContentHash(report) === report.contentHash
}

async function suppressionFor(
  finding: Finding,
  readSource: (path: string) => Promise<string | undefined>,
  cache: Map<string, SuppressionRange[]>,
): Promise<SuppressionRange | undefined> {
  // Only source-located findings can carry an inline waiver; a DOM finding has
  // no comment to attach one to. Waiving those is a config-level decision.
  if (finding.location.kind !== 'source') return undefined
  const file = finding.location.file
  let ranges = cache.get(file)
  if (!ranges) {
    const source = await readSource(file)
    ranges = source === undefined ? [] : parseSuppressions(source)
    cache.set(file, ranges)
  }
  return findSuppression(ranges, finding.ruleId, finding.location.line)
}

function defaultReader(rootDir: string) {
  return async (relativePath: string): Promise<string | undefined> => {
    try {
      return await readFile(join(rootDir, relativePath), 'utf8')
    } catch {
      return undefined
    }
  }
}

async function safeBuildMetrics(input: ScanInput): Promise<ScanReport['metrics']> {
  const { analyzeBuild } = await import('./build-analysis.js')
  try {
    return await analyzeBuild(input.buildDir!)
  } catch {
    return {}
  }
}

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

/** Convenience for CLI exit codes and Action gating. */
export function shouldFail(report: ScanReport, failOn: ScanInput['config']['failOn'], onlyNew?: Set<string>): boolean {
  if (failOn === 'never') return false
  const threshold = ['minor', 'moderate', 'serious', 'critical'].indexOf(failOn)
  return report.findings.some((f) => {
    if (onlyNew && !onlyNew.has(f.fingerprint)) return false
    return ['minor', 'moderate', 'serious', 'critical'].indexOf(f.severity) >= threshold
  })
}

export function countByDomain(report: ScanReport): Record<string, number> {
  const out: Record<string, number> = { accessibility: 0, privacy: 0, 'client-impact': 0 }
  for (const f of report.findings) out[domainOf(f.kind)] = (out[domainOf(f.kind)] ?? 0) + 1
  return out
}
