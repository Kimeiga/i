import type { RawFinding, Rule } from '@attestci/core'
import type { StaticContext } from '@attestci/core/static'
import { locationOf } from '@attestci/core/static'
import { PROPERTIES } from '../standards.js'

/**
 * A whole route opted out of server rendering by one directive.
 *
 * `'use client'` at the top of `page.tsx` or `layout.tsx` puts the entire
 * subtree below it in the browser bundle, including every component it renders
 * that would otherwise have stayed on the server. It is a one-line change with
 * a large, invisible cost, and it is usually added to fix a single `useState`
 * that could have moved into a leaf component instead.
 *
 * This is a legitimate choice for genuinely interactive routes, which is why it
 * is reported at moderate severity with the trade-off spelled out rather than
 * treated as a defect.
 */

const ROUTE_ENTRY = /(^|\/)(page|layout|template)\.[cm]?[jt]sx?$/

const rule: Rule<StaticContext> = {
  id: 'client/route-entry-is-client-component',
  kind: 'client-impact',
  title: 'Route entry point marked "use client"',
  description:
    'A page, layout or template file carries a "use client" directive, which moves the whole component ' +
    'subtree below it into the browser bundle. Moving the directive down to the component that ' +
    'actually needs interactivity keeps the rest of the route on the server.',
  severity: 'moderate',
  docs: 'client-route-entry-is-client-component',
  standards: [PROPERTIES.deliveryCost],
  fixtures: {
    triggering: ['fixtures/client/route-entry-is-client-component/app/dashboard/page.tsx'],
    clean: ['fixtures/client/route-entry-is-client-component/app/reports/page.tsx'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      const relative = ctx.relative(file)
      if (!ROUTE_ENTRY.test(relative)) continue
      if (!ctx.isClientBoundary(file)) continue

      const first = file.getStatements()[0]
      if (!first) continue

      findings.push({
        message:
          `\`${relative}\` is a route entry point marked "use client", so everything it renders ships ` +
          `to the browser.`,
        location: locationOf(first, ctx.rootDir),
        evidence: `"use client"`,
        help:
          'Move the directive to the smallest component that needs browser APIs or state, and keep the ' +
          'page or layout itself on the server. If the whole route really is an interactive ' +
          'application, this finding is the expected cost and can be suppressed with a reason.',
        surface: relative,
      })
    }

    return findings
  },
}

export default rule
