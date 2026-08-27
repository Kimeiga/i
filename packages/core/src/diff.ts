import type {
  BoundaryChange,
  ClientImpact,
  DiffVerdict,
  Finding,
  RuleKind,
  ScanReport,
  SemanticDiff,
  SurfaceDelta,
} from './types.js'
import { domainOf } from './types.js'
import { compareFindings } from './identity.js'
import { DISCLAIMER } from './product.js'

/**
 * The semantic diff: what changed about the application's behaviour between two
 * scans, not what changed about the list of lint errors.
 *
 * The distinction matters in one specific way. A textual diff of two reports
 * reports every finding in an edited file as new, because line numbers moved.
 * This function compares by fingerprint, which excludes position — so a PR that
 * adds an import at the top of a file with ten pre-existing findings reports
 * zero new findings, which is the truth.
 *
 * The second honesty requirement: if a layer ran on one side and not the other,
 * its findings are excluded from the delta entirely and the layer is named in
 * `incomparableLayers`. Reporting "12 accessibility violations fixed" because
 * the head scan could not launch a browser would be the single most damaging
 * bug this product could ship.
 */
export function diffReports(base: ScanReport, head: ScanReport): SemanticDiff {
  const comparable = comparableKinds(base, head)
  const incomparableLayers = allKinds().filter((k) => !comparable.has(k) && kindPresent(base, head, k))

  const basePartition = partition(base.findings, comparable)
  const headPartition = partition(head.findings, comparable)

  const accessibility = deltaFor(basePartition.accessibility, headPartition.accessibility)
  const privacy = deltaFor(basePartition.privacy, headPartition.privacy)
  const client = deltaFor(basePartition['client-impact'], headPartition['client-impact'])

  const clientImpact: ClientImpact = {
    ...startupJsDelta(base, head),
    added: client.added,
    removed: client.removed,
    persisting: client.persisting,
  }

  const totalAdded = accessibility.added.length + privacy.added.length + client.added.length
  const totalRemoved = accessibility.removed.length + privacy.removed.length + client.removed.length

  return {
    schemaVersion: '1',
    base: { scanId: base.scan.id, contentHash: base.contentHash, commit: base.target.commit },
    head: { scanId: head.scan.id, contentHash: head.contentHash, commit: head.target.commit },
    accessibility: {
      ...accessibility,
      bySurface: groupBySurface(accessibility.added, accessibility.removed, accessibility.persisting),
    },
    privacy: {
      ...privacy,
      boundaryChanges: boundaryChanges(privacy.added),
    },
    clientImpact,
    verdict: verdictFor(totalAdded, totalRemoved),
    incomparableLayers,
    disclaimer: DISCLAIMER,
  }
}

function allKinds(): RuleKind[] {
  return ['runtime-a11y', 'static-a11y', 'static-privacy', 'client-impact']
}

/** A layer is comparable only if it ran in both reports. */
function comparableKinds(base: ScanReport, head: ScanReport): Set<RuleKind> {
  const ran = (r: ScanReport) => new Set(r.coverage.layers.filter((l) => l.ran).map((l) => l.kind))
  const b = ran(base)
  const h = ran(head)
  return new Set(allKinds().filter((k) => b.has(k) && h.has(k)))
}

/** Only name a layer as incomparable if at least one side actually ran it. */
function kindPresent(base: ScanReport, head: ScanReport, kind: RuleKind): boolean {
  return [base, head].some((r) => r.coverage.layers.some((l) => l.kind === kind && l.ran))
}

function partition(
  findings: readonly Finding[],
  comparable: ReadonlySet<RuleKind>,
): Record<'accessibility' | 'privacy' | 'client-impact', Finding[]> {
  const out = { accessibility: [] as Finding[], privacy: [] as Finding[], 'client-impact': [] as Finding[] }
  for (const f of findings) {
    if (!comparable.has(f.kind)) continue
    out[domainOf(f.kind)].push(f)
  }
  return out
}

interface Delta {
  added: Finding[]
  removed: Finding[]
  persisting: Finding[]
}

function deltaFor(base: readonly Finding[], head: readonly Finding[]): Delta {
  const baseByPrint = new Map(base.map((f) => [f.fingerprint, f]))
  const headByPrint = new Map(head.map((f) => [f.fingerprint, f]))

  const added = head.filter((f) => !baseByPrint.has(f.fingerprint)).sort(compareFindings)
  const removed = base.filter((f) => !headByPrint.has(f.fingerprint)).sort(compareFindings)
  const persisting = head.filter((f) => baseByPrint.has(f.fingerprint)).sort(compareFindings)

  return { added, removed, persisting }
}

function groupBySurface(
  added: readonly Finding[],
  removed: readonly Finding[],
  persisting: readonly Finding[],
): SurfaceDelta[] {
  const surfaces = new Map<string, SurfaceDelta>()
  const ensure = (surface: string): SurfaceDelta => {
    let entry = surfaces.get(surface)
    if (!entry) {
      entry = { surface, added: [], removed: [], persisting: [] }
      surfaces.set(surface, entry)
    }
    return entry
  }

  for (const f of added) (ensure(f.surface).added as Finding[]).push(f)
  for (const f of removed) (ensure(f.surface).removed as Finding[]).push(f)
  for (const f of persisting) (ensure(f.surface).persisting as Finding[]).push(f)

  return [...surfaces.values()].sort(
    (a, b) => b.added.length - a.added.length || a.surface.localeCompare(b.surface),
  )
}

function boundaryChanges(added: readonly Finding[]): BoundaryChange[] {
  return added
    .filter((f): f is Finding & { boundary: NonNullable<Finding['boundary']> } => f.boundary !== undefined)
    .map((f) => ({
      subject: f.boundary.subject,
      from: f.boundary.from,
      to: f.boundary.to,
      ruleId: f.ruleId,
      finding: f,
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject))
}

function startupJsDelta(base: ScanReport, head: ScanReport): Partial<ClientImpact> {
  const b = base.metrics.startupJsBytes
  const h = head.metrics.startupJsBytes
  // Without both sides there is no delta. Reporting "+0 KB" when one build was
  // never measured would read as "no change", which is not what we know.
  if (!b || !h) return {}

  const byRoute: Record<string, number> = {}
  for (const route of new Set([...Object.keys(b), ...Object.keys(h)])) {
    const delta = (h[route] ?? 0) - (b[route] ?? 0)
    if (delta !== 0) byRoute[route] = delta
  }

  const total =
    head.metrics.totalStartupJsBytes !== undefined && base.metrics.totalStartupJsBytes !== undefined
      ? head.metrics.totalStartupJsBytes - base.metrics.totalStartupJsBytes
      : undefined

  return {
    startupJsBytesDelta: total,
    startupJsByRouteDelta: Object.keys(byRoute).length > 0 ? sortRecord(byRoute) : undefined,
  }
}

function sortRecord(input: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(input).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)))
}

function verdictFor(added: number, removed: number): DiffVerdict {
  if (added > 0 && removed > 0) return 'mixed'
  if (added > 0) return 'regressed'
  if (removed > 0) return 'improved'
  return 'unchanged'
}

/** Fingerprints introduced by the head scan; used for `--fail-on-new-only`. */
export function newFingerprints(diff: SemanticDiff): Set<string> {
  return new Set(
    [...diff.accessibility.added, ...diff.privacy.added, ...diff.clientImpact.added].map(
      (f) => f.fingerprint,
    ),
  )
}
