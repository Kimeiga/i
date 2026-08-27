import type { Finding, ScanReport, SemanticDiff } from '../types.js'
import { AUTOMATED_COVERAGE_NOTE, DISCLAIMER, PRODUCT_NAME } from '../product.js'
import {
  boundaryLine,
  clientImpactSummary,
  layerName,
  scanSummary,
  surfaceSummary,
  unrunLayers,
  verdictSentence,
} from '../summarize.js'

export interface TerminalOptions {
  color?: boolean
  /** Findings shown per section before truncating. */
  limit?: number
}

const RESET = '[0m'
const STYLES = {
  bold: '[1m',
  dim: '[2m',
  red: '[31m',
  yellow: '[33m',
  green: '[32m',
  blue: '[34m',
  magenta: '[35m',
} as const

function styler(enabled: boolean) {
  return (style: keyof typeof STYLES, text: string): string =>
    enabled ? `${STYLES[style]}${text}${RESET}` : text
}

export function shouldUseColor(stream: { isTTY?: boolean } = process.stdout): boolean {
  if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== '') return false
  if (process.env.FORCE_COLOR !== undefined && process.env.FORCE_COLOR !== '0') return true
  return Boolean(stream.isTTY)
}

export function renderScan(report: ScanReport, options: TerminalOptions = {}): string {
  const c = styler(options.color ?? false)
  const limit = options.limit ?? 25
  const lines: string[] = []

  lines.push(c('bold', `${PRODUCT_NAME} ${report.tool.version}`))
  lines.push(scanSummary(report))
  lines.push('')

  const bySurface = new Map<string, Finding[]>()
  for (const f of report.findings) {
    const list = bySurface.get(f.surface) ?? []
    list.push(f)
    bySurface.set(f.surface, list)
  }

  let shown = 0
  for (const [surface, findings] of [...bySurface].sort((a, b) => b[1].length - a[1].length)) {
    if (shown >= limit) {
      lines.push(c('dim', `… ${report.findings.length - shown} more findings not shown`))
      break
    }
    lines.push(c('bold', surface))
    for (const f of findings) {
      if (shown >= limit) break
      shown++
      lines.push(`  ${severityTag(c, f.severity)} ${f.message}`)
      lines.push(c('dim', `    ${locationText(f)}  ${f.ruleId}`))
      if (f.evidence) lines.push(c('dim', `    ${truncate(f.evidence, 120)}`))
      lines.push(c('dim', `    fix: ${f.help}`))
    }
    lines.push('')
  }

  // Coverage first, before any celebration of a clean run.
  const unrun = unrunLayers(report)
  if (unrun.length > 0) {
    lines.push(c('yellow', 'Checks that did not run'))
    for (const line of unrun) lines.push(`  ${line}`)
    lines.push('')
  }

  lines.push(c('bold', 'Coverage'))
  for (const layer of report.coverage.layers) {
    const status = layer.ran
      ? `${layer.rulesRun} rules over ${layer.unitsExamined} ${layer.unitLabel}`
      : c('dim', `skipped — ${layer.reason ?? 'not applicable'}`)
    lines.push(`  ${layerName(layer.kind)}: ${status}`)
  }
  if (report.suppressed.length > 0) {
    lines.push(`  ${report.suppressed.length} finding(s) suppressed in source and recorded in the report`)
  }
  lines.push('')

  lines.push(c('dim', wrap(AUTOMATED_COVERAGE_NOTE, 88)))
  lines.push('')
  lines.push(c('dim', wrap(DISCLAIMER, 88)))
  lines.push(c('dim', `Report hash: ${report.contentHash}`))

  return lines.join('\n')
}

/**
 * The semantic diff, in the shape the product promises: three sections that
 * each answer "what changed about the app", not "which lint errors moved".
 */
export function renderDiff(diff: SemanticDiff, options: TerminalOptions = {}): string {
  const c = styler(options.color ?? false)
  const limit = options.limit ?? 12
  const lines: string[] = []
  let wroteSection = false

  const a11yAdded = diff.accessibility.added.length
  const a11yRemoved = diff.accessibility.removed.length
  if (a11yAdded > 0 || a11yRemoved > 0) {
    wroteSection = true
    lines.push(c('bold', 'Accessibility conformance changed'))
    for (const surface of diff.accessibility.bySurface.slice(0, limit)) {
      if (surface.added.length > 0) {
        lines.push(`${surface.surface}: ${c('red', surfaceSummary(surface.added))}`)
      }
      if (surface.removed.length > 0 && surface.added.length === 0) {
        lines.push(
          `${surface.surface}: ${c('green', `${surface.removed.length} resolved`)}`,
        )
      }
    }
    lines.push('')
  }

  if (diff.privacy.added.length > 0 || diff.privacy.removed.length > 0) {
    wroteSection = true
    lines.push(c('bold', 'Privacy boundary changed'))
    for (const change of diff.privacy.boundaryChanges.slice(0, limit)) {
      lines.push(c('magenta', boundaryLine(change)))
    }
    // Privacy findings without a declared transition still need to be shown.
    for (const f of diff.privacy.added.filter((x) => !x.boundary).slice(0, limit)) {
      lines.push(`${f.surface}: ${f.message}`)
    }
    if (diff.privacy.removed.length > 0) {
      lines.push(c('green', `${diff.privacy.removed.length} privacy finding(s) resolved`))
    }
    lines.push('')
  }

  const client = clientImpactSummary(diff.clientImpact)
  if (client) {
    wroteSection = true
    lines.push(c('bold', 'Client impact'))
    lines.push(client)
    lines.push('')
  }

  if (!wroteSection) {
    lines.push(c('green', 'No change in accessibility, privacy boundaries, or client impact.'))
    lines.push('')
  }

  lines.push(c('dim', verdictSentence(diff)))

  if (diff.incomparableLayers.length > 0) {
    lines.push('')
    lines.push(c('yellow', 'Not compared'))
    for (const kind of diff.incomparableLayers) {
      lines.push(`  ${layerName(kind)} ran in only one of the two scans, so it is excluded from this diff.`)
    }
  }

  lines.push('')
  lines.push(c('dim', `base ${diff.base.contentHash}`))
  lines.push(c('dim', `head ${diff.head.contentHash}`))
  lines.push(c('dim', wrap(DISCLAIMER, 88)))

  return lines.join('\n')
}

function severityTag(c: ReturnType<typeof styler>, severity: string): string {
  switch (severity) {
    case 'critical':
      return c('red', 'critical')
    case 'serious':
      return c('red', 'serious ')
    case 'moderate':
      return c('yellow', 'moderate')
    default:
      return c('blue', 'minor   ')
  }
}

function locationText(f: Finding): string {
  switch (f.location.kind) {
    case 'source':
      return `${f.location.file}:${f.location.line}:${f.location.column}`
    case 'dom':
      return `${f.location.url} ${f.location.selector}`
    case 'artifact':
      return `${f.location.artifact}${f.location.entry ? ` (${f.location.entry})` : ''}`
  }
}

function truncate(text: string, max: number): string {
  const single = text.replace(/\s+/g, ' ').trim()
  return single.length <= max ? single : `${single.slice(0, max - 1)}…`
}

export function wrap(text: string, width: number): string {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (current.length === 0) current = word
    else if (current.length + 1 + word.length <= width) current += ` ${word}`
    else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.join('\n')
}
