import type { Finding, SemanticDiff, ScanReport } from './types.js'
import { formatBytesDelta } from './build-analysis.js'

/**
 * Phrase fragments shared by every renderer.
 *
 * Terminal output, the PR comment and the dashboard must never disagree about
 * what a scan said. Putting the wording here rather than in each formatter is
 * what guarantees that.
 */

/** `a11y/label-association` -> `label association`. */
export function ruleLabel(ruleId: string): string {
  const tail = ruleId.split('/').slice(1).join('/') || ruleId
  return tail.replace(/-/g, ' ')
}

const SMALL_NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

export function count(n: number): string {
  return n < SMALL_NUMBERS.length ? SMALL_NUMBERS[n]! : String(n)
}

export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return n === 1 ? singular : pluralForm
}

/**
 * Names the standard a group of accessibility findings maps to.
 *
 * Says "WCAG 2.1 AA" only when the findings actually carry AA success criteria.
 * A static rule with no criterion mapping gets the honest generic phrasing
 * rather than being dressed up as a WCAG violation.
 */
export function standardLabel(findings: readonly Finding[]): string {
  const levels = new Set<string>()
  let anyWcag = false
  for (const f of findings) {
    for (const s of f.standards) {
      if (s.framework === 'wcag21') {
        anyWcag = true
        if (s.level) levels.add(s.level)
      }
    }
  }
  if (!anyWcag) return 'accessibility'
  const ordered = ['A', 'AA', 'AAA'].filter((l) => levels.has(l))
  return ordered.length > 0 ? `WCAG 2.1 ${ordered.join('/')}` : 'WCAG 2.1'
}

/** `3 new WCAG 2.1 AA violations (label association, focus order)` */
export function surfaceSummary(added: readonly Finding[]): string {
  const labels = [...new Set(added.map((f) => ruleLabel(f.ruleId)))].sort()
  const shown = labels.slice(0, 3)
  const suffix = labels.length > shown.length ? `, +${labels.length - shown.length} more` : ''
  return `${added.length} new ${standardLabel(added)} ${plural(added.length, 'violation')} (${shown.join(', ')}${suffix})`
}

/** `customer_profile: session-private -> reachable from public cache` */
export function boundaryLine(change: SemanticDiff['privacy']['boundaryChanges'][number]): string {
  return `${change.subject}: ${change.from} → ${change.to}`
}

/** `+18 KB startup JavaScript, one new eager data waterfall` */
export function clientImpactSummary(impact: SemanticDiff['clientImpact']): string | undefined {
  const parts: string[] = []
  if (impact.startupJsBytesDelta !== undefined && impact.startupJsBytesDelta !== 0) {
    parts.push(`${formatBytesDelta(impact.startupJsBytesDelta)} startup JavaScript`)
  }

  const byRule = new Map<string, number>()
  for (const f of impact.added) byRule.set(f.ruleId, (byRule.get(f.ruleId) ?? 0) + 1)
  for (const [ruleId, n] of [...byRule].sort(([a], [b]) => a.localeCompare(b))) {
    parts.push(`${count(n)} new ${plural(n, ruleLabel(ruleId))}`)
  }

  return parts.length > 0 ? parts.join(', ') : undefined
}

export function verdictSentence(diff: SemanticDiff): string {
  switch (diff.verdict) {
    case 'regressed':
      return 'This change introduces findings that were not present in the base scan.'
    case 'improved':
      return 'This change removes findings that were present in the base scan and introduces none.'
    case 'mixed':
      return 'This change both introduces and removes findings.'
    case 'unchanged':
      return 'No change in findings relative to the base scan.'
  }
}

/** One-line summary of a single scan, used in the terminal header. */
export function scanSummary(report: ScanReport): string {
  const bySeverity = new Map<string, number>()
  for (const f of report.findings) bySeverity.set(f.severity, (bySeverity.get(f.severity) ?? 0) + 1)
  const order = ['critical', 'serious', 'moderate', 'minor'] as const
  const parts = order.filter((s) => bySeverity.has(s)).map((s) => `${bySeverity.get(s)} ${s}`)
  if (parts.length === 0) return 'No findings from the checks that ran.'
  return `${report.findings.length} ${plural(report.findings.length, 'finding')} (${parts.join(', ')})`
}

/**
 * States which layers did not run, so a clean report is never mistaken for a
 * complete one. Returns an empty array when everything ran.
 */
export function unrunLayers(report: ScanReport): string[] {
  return report.coverage.layers
    .filter((l) => !l.ran)
    .map((l) => `${layerName(l.kind)} did not run${l.reason ? `: ${l.reason}` : ''}`)
}

export function layerName(kind: string): string {
  switch (kind) {
    case 'runtime-a11y':
      return 'Runtime accessibility (axe-core in a browser)'
    case 'static-a11y':
      return 'Static accessibility (source analysis)'
    case 'static-privacy':
      return 'Privacy and placement (source analysis)'
    case 'client-impact':
      return 'Client impact'
    default:
      return kind
  }
}
