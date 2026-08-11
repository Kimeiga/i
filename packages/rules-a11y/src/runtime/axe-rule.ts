import type { RawFinding, Rule, RuleFixtures, Severity, StandardRef } from '@attestci/core'
import type { RuntimeA11yContext } from './context.js'

/**
 * Turns an axe-core rule id into an Attest rule.
 *
 * This is what keeps the "one rule per 90-minute session" promise honest for
 * the accessibility pack: adding coverage of another axe rule is a title, a
 * severity, a criterion mapping, two fixture pages and a docs page. No code.
 *
 * The severity is ours rather than axe's `impact`. axe scores impact on the
 * user harm of a single instance; we score on what should stop a pull request,
 * and those are different questions. The axe impact is still carried into the
 * finding's evidence so nothing is lost.
 */
export interface AxeRuleSpec {
  /** Our id, stable forever once published. */
  id: string
  /** The axe-core rule id this wraps. */
  axeRuleId: string
  title: string
  description: string
  severity: Severity
  docs: string
  standards: readonly StandardRef[]
  fixtures: RuleFixtures
  experimental?: boolean
}

export function axeRule(spec: AxeRuleSpec): Rule<RuntimeA11yContext> {
  return {
    id: spec.id,
    kind: 'runtime-a11y',
    title: spec.title,
    description: spec.description,
    severity: spec.severity,
    docs: spec.docs,
    standards: spec.standards,
    fixtures: spec.fixtures,
    experimental: spec.experimental,
    check(ctx: RuntimeA11yContext): RawFinding[] {
      return ctx.violationsFor(spec.axeRuleId).map(({ url, violation, node }) => ({
        message: violation.help,
        location: {
          kind: 'dom',
          url,
          selector: node.target.join(' '),
          html: truncate(node.html, 240),
        },
        evidence: node.failureSummary
          ? `${truncate(node.html, 160)} — ${truncate(node.failureSummary.replace(/\s+/g, ' '), 200)}`
          : truncate(node.html, 200),
        help: `${violation.description} See ${violation.helpUrl} for the axe-core explanation.`,
        surface: surfaceOf(url),
      }))
    },
  }
}

function surfaceOf(url: string): string {
  try {
    const { pathname } = new URL(url)
    return pathname === '/' ? '/' : pathname.replace(/\/$/, '')
  } catch {
    return url
  }
}

function truncate(text: string, max: number): string {
  const single = text.replace(/\s+/g, ' ').trim()
  return single.length <= max ? single : `${single.slice(0, max - 1)}…`
}
