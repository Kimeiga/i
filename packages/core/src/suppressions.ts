import type { SuppressionDirective } from './types.js'
import { PRODUCT_SLUG } from './product.js'

/**
 * Source-comment suppressions.
 *
 * Three directives, matching the shape developers already know from ESLint:
 *
 *   // attest-disable-next-line a11y/img-alt -- decorative, alt="" set by CMS
 *   const x = 1 // attest-disable-line a11y/img-alt -- reason
 *   // attest-disable-file privacy/session-data-in-shared-cache -- reason
 *
 * The rule id may be omitted to waive every rule at that location, and several
 * ids may be comma-separated. Everything after `--` is kept verbatim as the
 * reason and surfaced in the report — see SuppressedFinding.
 */

export interface SuppressionRange {
  directive: SuppressionDirective
  /** 1-based. For `disable-file` this is 0 and `endLine` is Infinity. */
  line: number
  endLine: number
  /** Empty set means "all rules". */
  ruleIds: ReadonlySet<string>
  reason: string
}

const DIRECTIVE_RE = new RegExp(
  String.raw`${PRODUCT_SLUG}-(disable-next-line|disable-line|disable-file)` +
    String.raw`(?<ids>[^\n\r*]*?)?` +
    String.raw`(?:--\s*(?<reason>[^\n\r*]*))?$`,
  'gm',
)

/**
 * Extracts suppression directives from source text.
 *
 * Deliberately naive: it scans comment-looking lines with a regex instead of
 * parsing. A directive inside a string literal would be honoured incorrectly,
 * which is an acceptable trade for a function that costs microseconds and has
 * no dependency on any particular parser. Rules of all four kinds share it.
 */
export function parseSuppressions(source: string): SuppressionRange[] {
  const out: SuppressionRange[] = []
  const lines = source.split(/\r\n|\n|\r/)

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i]!
    if (!text.includes(`${PRODUCT_SLUG}-disable`)) continue
    // Only honour directives that appear inside a comment.
    const commentStart = findCommentStart(text)
    if (commentStart === -1) continue

    DIRECTIVE_RE.lastIndex = 0
    const match = DIRECTIVE_RE.exec(text.slice(commentStart).replace(/\*\/\s*$/, ''))
    if (!match) continue

    const directive = match[1] as SuppressionDirective
    const ruleIds = new Set(
      (match.groups?.ids ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s !== '--'),
    )
    const reason = (match.groups?.reason ?? '').trim()
    const lineNumber = i + 1

    if (directive === 'disable-file') {
      out.push({ directive, line: 0, endLine: Number.MAX_SAFE_INTEGER, ruleIds, reason })
    } else if (directive === 'disable-next-line') {
      out.push({ directive, line: lineNumber + 1, endLine: lineNumber + 1, ruleIds, reason })
    } else {
      out.push({ directive, line: lineNumber, endLine: lineNumber, ruleIds, reason })
    }
  }

  return out
}

function findCommentStart(text: string): number {
  const line = text.indexOf('//')
  const block = text.indexOf('/*')
  if (line === -1) return block
  if (block === -1) return line
  return Math.min(line, block)
}

export function findSuppression(
  ranges: readonly SuppressionRange[],
  ruleId: string,
  line: number,
): SuppressionRange | undefined {
  return ranges.find(
    (r) => line >= r.line && line <= r.endLine && (r.ruleIds.size === 0 || r.ruleIds.has(ruleId)),
  )
}
