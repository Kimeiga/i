import { SyntaxKind } from 'ts-morph'
import type { RawFinding, Rule } from '@attestci/core'
import type { StaticContext } from '@attestci/core/static'
import { excerpt, locationOf } from '@attestci/core/static'
import { PROPERTIES } from '../standards.js'
import { calleeName, literalString } from '../helpers.js'

/**
 * Invalidation that throws away far more cache than the write dirtied.
 *
 * `revalidatePath('/', 'layout')` invalidates every cached route in the
 * application. It is the reflex fix for "my page did not update", it always
 * works, and it converts a cached site into an uncached one — usually in a
 * server action that runs on every form submission.
 *
 * The cost is invisible in development and shows up as origin load in
 * production, which is why nobody catches it in review.
 */

const rule: Rule<StaticContext> = {
  id: 'privacy/over-broad-cache-invalidation',
  kind: 'static-privacy',
  title: 'Cache invalidation broader than the data that changed',
  description:
    "A call to revalidatePath at the application root, or with layout scope at the root, discards " +
    'every cached route rather than the routes affected by the write. It is usually reached for when a ' +
    'narrower invalidation did not appear to work.',
  severity: 'moderate',
  docs: 'privacy-over-broad-cache-invalidation',
  standards: [PROPERTIES.invalidationScope],
  fixtures: {
    triggering: ['fixtures/privacy/over-broad-cache-invalidation/triggering.ts'],
    clean: ['fixtures/privacy/over-broad-cache-invalidation/clean.ts'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      for (const call of file.getDescendantsOfKind(SyntaxKind.CallExpression)) {
        if (calleeName(call) !== 'revalidatePath') continue

        const args = call.getArguments()
        const path = args[0] ? literalString(args[0]) : undefined
        const scope = args[1] ? literalString(args[1]) : undefined

        const isRoot = path === '/'
        const isLayoutScoped = scope === 'layout'
        if (!isRoot) continue

        findings.push({
          message: isLayoutScoped
            ? "`revalidatePath('/', 'layout')` invalidates every cached route in the application."
            : "`revalidatePath('/')` invalidates the root route and everything nested under it.",
          location: locationOf(call, ctx.rootDir),
          evidence: excerpt(call, 120),
          help:
            'Invalidate the paths or tags the write actually affected. If a narrower call did not work, ' +
            'the usual cause is a mismatch between the path passed here and the route segment that ' +
            'rendered the data, not the scope being too small.',
          surface: ctx.relative(file),
        })
      }
    }

    return findings
  },
}

export default rule
