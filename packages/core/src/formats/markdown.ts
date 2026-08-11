import type { Finding, ScanReport, SemanticDiff } from '../types.js'
import {
  ATTRIBUTION,
  AUTOMATED_COVERAGE_NOTE,
  DISCLAIMER,
  PRODUCT_NAME,
  PRODUCT_URL,
} from '../product.js'
import {
  boundaryLine,
  clientImpactSummary,
  layerName,
  surfaceSummary,
  unrunLayers,
  verdictSentence,
} from '../summarize.js'

/**
 * Marker used to find and update this comment on subsequent pushes instead of
 * posting a new one. A bot that adds a comment per push is a bot people mute.
 */
export const COMMENT_MARKER = '<!-- attest:pr-comment:v1 -->'

export interface PrCommentOptions {
  /** Base URL for linking findings to files, e.g. a repo blob URL at a sha. */
  fileUrlBase?: string
  limitPerSection?: number
  dashboardUrl?: string
}

export function renderPrComment(
  diff: SemanticDiff,
  head: ScanReport,
  options: PrCommentOptions = {},
): string {
  const limit = options.limitPerSection ?? 10
  const out: string[] = [COMMENT_MARKER, '']

  out.push(`### ${PRODUCT_NAME}: ${headline(diff)}`, '')

  const a11y = diff.accessibility
  if (a11y.added.length > 0 || a11y.removed.length > 0) {
    out.push('**Accessibility conformance changed**', '')
    for (const surface of a11y.bySurface.slice(0, limit)) {
      if (surface.added.length > 0) {
        out.push(`- \`${surface.surface}\`: ${surfaceSummary(surface.added)}`)
      }
    }
    if (a11y.removed.length > 0) {
      out.push(`- ${a11y.removed.length} previously reported finding(s) no longer detected`)
    }
    out.push('')
  }

  if (diff.privacy.added.length > 0 || diff.privacy.removed.length > 0) {
    out.push('**Privacy boundary changed**', '')
    for (const change of diff.privacy.boundaryChanges.slice(0, limit)) {
      out.push(`- ${boundaryLine(change)}`)
    }
    for (const f of diff.privacy.added.filter((x) => !x.boundary).slice(0, limit)) {
      out.push(`- \`${f.surface}\`: ${f.message}`)
    }
    if (diff.privacy.removed.length > 0) {
      out.push(`- ${diff.privacy.removed.length} privacy finding(s) resolved`)
    }
    out.push('')
  }

  const client = clientImpactSummary(diff.clientImpact)
  if (client) {
    out.push('**Client impact**', '', `- ${client}`, '')
  }

  if (a11y.added.length === 0 && diff.privacy.added.length === 0 && !client) {
    out.push('No new findings from the checks that ran.', '')
  }

  const allAdded = [...a11y.added, ...diff.privacy.added, ...diff.clientImpact.added]
  if (allAdded.length > 0) {
    out.push('<details><summary>New findings in detail</summary>', '')
    out.push('| Severity | Rule | Where | What |')
    out.push('| --- | --- | --- | --- |')
    for (const f of allAdded.slice(0, 50)) {
      out.push(
        `| ${f.severity} | [${f.ruleId}](${f.helpUrl}) | ${locationCell(f, options.fileUrlBase)} | ${escapeCell(f.message)} |`,
      )
    }
    if (allAdded.length > 50) out.push(`| … | ${allAdded.length - 50} more | | |`)
    out.push('', '</details>', '')
  }

  if (diff.incomparableLayers.length > 0) {
    out.push('> **Not compared.** ' +
      diff.incomparableLayers.map((k) => layerName(k)).join(', ') +
      ' ran in only one of the two scans, so findings from it are excluded from this diff.', '')
  }

  const unrun = unrunLayers(head)
  if (unrun.length > 0) {
    out.push('<details><summary>Checks that did not run</summary>', '')
    for (const line of unrun) out.push(`- ${line}`)
    out.push('', '</details>', '')
  }

  out.push('---', '')
  out.push(`_${verdictSentence(diff)}_`, '')
  out.push(`_${AUTOMATED_COVERAGE_NOTE}_`, '')
  out.push(`_${DISCLAIMER}_`, '')
  out.push(`_${ATTRIBUTION}_`, '')
  out.push(
    `<sub>Report hash \`${head.contentHash}\` · ` +
      (options.dashboardUrl ? `[history](${options.dashboardUrl}) · ` : '') +
      `[${PRODUCT_NAME}](${PRODUCT_URL})</sub>`,
  )

  return out.join('\n')
}

function headline(diff: SemanticDiff): string {
  const added = diff.accessibility.added.length + diff.privacy.added.length + diff.clientImpact.added.length
  const removed =
    diff.accessibility.removed.length + diff.privacy.removed.length + diff.clientImpact.removed.length
  switch (diff.verdict) {
    case 'regressed':
      return `${added} new finding${added === 1 ? '' : 's'}`
    case 'improved':
      return `${removed} finding${removed === 1 ? '' : 's'} resolved`
    case 'mixed':
      return `${added} new, ${removed} resolved`
    case 'unchanged':
      return 'no change'
  }
}

function locationCell(f: Finding, fileUrlBase?: string): string {
  switch (f.location.kind) {
    case 'source': {
      const text = `${f.location.file}:${f.location.line}`
      return fileUrlBase
        ? `[${text}](${fileUrlBase}/${f.location.file}#L${f.location.line})`
        : `\`${text}\``
    }
    case 'dom':
      return `\`${f.location.selector}\` on ${f.location.url}`
    case 'artifact':
      return `\`${f.location.artifact}\``
  }
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

/** Full scan rendered as markdown, used for the published public scan pages. */
export function renderScanMarkdown(report: ScanReport): string {
  const out: string[] = []
  out.push(`# ${PRODUCT_NAME} scan report`, '')
  out.push(`- Tool: ${report.tool.name} ${report.tool.version}`)
  out.push(`- Scanned: ${report.scan.startedAt}`)
  if (report.target.repository) out.push(`- Repository: ${report.target.repository}`)
  if (report.target.commit) out.push(`- Commit: \`${report.target.commit}\``)
  out.push(`- Report hash: \`${report.contentHash}\``)
  out.push('')

  out.push('## What ran', '')
  out.push('| Layer | Ran | Rules | Examined |')
  out.push('| --- | --- | --- | --- |')
  for (const l of report.coverage.layers) {
    out.push(
      `| ${layerName(l.kind)} | ${l.ran ? 'yes' : `no — ${l.reason ?? 'n/a'}`} | ${l.rulesRun} | ${l.unitsExamined} ${l.unitLabel} |`,
    )
  }
  out.push('')

  out.push('## Findings', '')
  if (report.findings.length === 0) {
    out.push('No findings from the checks that ran. This is not a statement that the application is accessible.', '')
  } else {
    out.push('| Severity | Rule | Surface | Where | What |')
    out.push('| --- | --- | --- | --- | --- |')
    for (const f of report.findings) {
      out.push(
        `| ${f.severity} | [${f.ruleId}](${f.helpUrl}) | \`${f.surface}\` | ${locationCell(f)} | ${escapeCell(f.message)} |`,
      )
    }
    out.push('')
  }

  if (report.suppressed.length > 0) {
    out.push('## Suppressed', '')
    out.push('Waived in source. Recorded here deliberately: a suppression is a decision, and the evidence trail keeps decisions.', '')
    out.push('| Rule | Surface | Reason |')
    out.push('| --- | --- | --- |')
    for (const s of report.suppressed) {
      out.push(`| ${s.ruleId} | \`${s.surface}\` | ${escapeCell(s.reason || '_no reason given_')} |`)
    }
    out.push('')
  }

  out.push('---', '')
  out.push(`_${AUTOMATED_COVERAGE_NOTE}_`, '')
  out.push(`_${DISCLAIMER}_`, '')
  out.push(`_${ATTRIBUTION}_`, '')
  return out.join('\n')
}
