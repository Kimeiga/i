import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { AnyRulePack, Finding, RawFinding, Rule, ScanInput } from './types.js'
import { resolveConfig } from './config.js'
import { discoverFiles } from './discover.js'

/**
 * The fixture harness.
 *
 * Every rule ships with code that must trigger it and code that must not, and
 * this runs both. The second half is the important one: a rule that finds real
 * problems and also fires on correct code is worse than no rule, because the
 * first false positive teaches a team to ignore the whole tool.
 *
 * Exported from the published package so anyone writing a rule of their own
 * gets the same harness rather than inventing one.
 */

export interface FixtureRunResult {
  findings: RawFinding[]
  /** Repo-relative file path -> findings located in it. */
  byFile: Map<string, RawFinding[]>
  /** Files the harness parsed, for diagnosing an empty result. */
  filesScanned: string[]
}

export interface FixtureCheckProblem {
  kind: 'missing-fixture' | 'no-finding' | 'false-positive' | 'stray-finding' | 'convention'
  message: string
}

/**
 * Fixtures live at `fixtures/<group>/<rule-slug>/…`. The whole directory is
 * parsed together so rules that need an import graph — most of the interesting
 * ones — see the same shape they would in a real repository.
 */
export function fixtureRootOf(rule: Rule<unknown>): string | undefined {
  const first = rule.fixtures.triggering[0] ?? rule.fixtures.clean[0]
  if (!first) return undefined
  const segments = first.split('/')
  return segments.length >= 3 ? segments.slice(0, 3).join('/') : undefined
}

export async function runRuleOnFixtures<Ctx>(
  rule: Rule<Ctx>,
  pack: AnyRulePack,
  repoRoot: string,
): Promise<FixtureRunResult> {
  const fixtureRoot = fixtureRootOf(rule as Rule<unknown>)
  if (!fixtureRoot) {
    throw new Error(`Rule ${rule.id} declares no fixtures`)
  }

  const include = [`${fixtureRoot}/**/*.{ts,tsx,js,jsx,mjs,cjs}`]
  const config = resolveConfig(undefined, { include })
  const files = await discoverFiles(repoRoot, include, config.exclude)

  const input: ScanInput = {
    rootDir: repoRoot,
    files,
    urls: [],
    config,
    // A fresh map per rule: sharing the parsed project between rules would let
    // one rule's fixtures leak into another's results.
    shared: new Map(),
  }

  const created = await pack.createContext(input)
  if (created.status === 'skipped') {
    throw new Error(`Rule ${rule.id}: pack ${pack.id} skipped the fixture scan (${created.reason})`)
  }

  const findings = await rule.check(created.context as Ctx)
  const byFile = new Map<string, RawFinding[]>()
  for (const finding of findings) {
    if (finding.location.kind !== 'source') continue
    const list = byFile.get(finding.location.file) ?? []
    list.push(finding)
    byFile.set(finding.location.file, list)
  }

  return { findings, byFile, filesScanned: files }
}

/**
 * Runs the fixtures and returns everything wrong, rather than throwing on the
 * first problem — a rule author fixing three things at once should see three.
 */
export async function checkRuleFixtures<Ctx>(
  rule: Rule<Ctx>,
  pack: AnyRulePack,
  repoRoot: string,
): Promise<FixtureCheckProblem[]> {
  const problems: FixtureCheckProblem[] = []

  const fixtureRoot = fixtureRootOf(rule as Rule<unknown>)
  if (!fixtureRoot) {
    return [{ kind: 'convention', message: `${rule.id}: declares no fixtures` }]
  }

  const declared = [...rule.fixtures.triggering, ...rule.fixtures.clean]
  for (const path of declared) {
    if (!path.startsWith(`${fixtureRoot}/`)) {
      problems.push({
        kind: 'convention',
        message: `${rule.id}: fixture ${path} is outside this rule's directory ${fixtureRoot}/`,
      })
    }
    if (!existsSync(join(repoRoot, path))) {
      problems.push({ kind: 'missing-fixture', message: `${rule.id}: fixture file ${path} does not exist` })
    }
  }
  if (rule.fixtures.triggering.length === 0) {
    problems.push({ kind: 'convention', message: `${rule.id}: declares no triggering fixture` })
  }
  if (rule.fixtures.clean.length === 0) {
    problems.push({
      kind: 'convention',
      message: `${rule.id}: declares no clean fixture, so nothing guards against false positives`,
    })
  }
  if (problems.some((p) => p.kind === 'missing-fixture')) return problems

  const result = await runRuleOnFixtures(rule, pack, repoRoot)

  for (const path of rule.fixtures.triggering) {
    if ((result.byFile.get(path) ?? []).length === 0) {
      problems.push({
        kind: 'no-finding',
        message:
          `${rule.id}: triggering fixture ${path} produced no finding ` +
          `(scanned ${result.filesScanned.length} files, total findings ${result.findings.length})`,
      })
    }
  }

  for (const path of rule.fixtures.clean) {
    const found = result.byFile.get(path) ?? []
    if (found.length > 0) {
      problems.push({
        kind: 'false-positive',
        message: `${rule.id}: clean fixture ${path} produced ${found.length} finding(s): ${found
          .map((f) => f.message)
          .join(' | ')}`,
      })
    }
  }

  // Support files — imported by a fixture but not declared — must stay silent
  // too, otherwise a rule can pass by reporting somewhere nobody is looking.
  const declaredSet = new Set(declared)
  for (const [path, found] of result.byFile) {
    if (declaredSet.has(path)) continue
    problems.push({
      kind: 'stray-finding',
      message: `${rule.id}: finding in undeclared fixture file ${path}: ${found[0]?.message ?? ''}`,
    })
  }

  return problems
}

/** Convenience for assertions that want completed findings, not raw ones. */
export function asFinding(rule: Rule<unknown>, raw: RawFinding): Finding {
  return {
    ruleId: rule.id,
    kind: rule.kind,
    severity: raw.severity ?? rule.severity,
    title: rule.title,
    message: raw.message,
    location: raw.location,
    evidence: raw.evidence,
    help: raw.help,
    helpUrl: '',
    standards: [...(raw.standards ?? rule.standards)],
    fingerprint: '',
    surface: raw.surface,
    boundary: raw.boundary,
  }
}
