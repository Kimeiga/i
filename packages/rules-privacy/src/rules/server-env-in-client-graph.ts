import type { RawFinding, Rule } from '@attestci/core'
import type { StaticContext } from '@attestci/core/static'
import { excerpt, locationOf } from '@attestci/core/static'
import { PROPERTIES } from '../standards.js'
import { envReads } from '../helpers.js'

/**
 * A server-side environment variable read from a module that ships to the
 * browser.
 *
 * This is the rule that justifies building the client import graph. Next.js
 * replaces `process.env.FOO` with `undefined` in client bundles unless FOO is
 * prefixed `NEXT_PUBLIC_`, so the failure is silent: the check that reads
 * `process.env.FEATURE_FLAG_X` simply evaluates to false in the browser
 * forever, and nothing errors.
 *
 * A per-file linter cannot find this, because the file doing the reading is
 * usually a shared helper with no `'use client'` in it — it became a client
 * module by being imported, five hops away, from something that has one.
 */

/**
 * Variables that bundlers define in client code on purpose. Reading these in
 * the browser is correct, not a mistake.
 */
const CLIENT_SAFE = new Set([
  'NODE_ENV',
  'NEXT_RUNTIME',
  'NEXT_PUBLIC_VERCEL_URL',
  'STORYBOOK',
  '__NEXT_ROUTER_BASEPATH',
])

const rule: Rule<StaticContext> = {
  id: 'privacy/server-env-in-client-graph',
  kind: 'static-privacy',
  title: 'Server-side environment variable read in a browser-bound module',
  description:
    'A module that is reachable from a "use client" boundary reads an environment variable without the ' +
    'NEXT_PUBLIC_ prefix. In the browser that expression evaluates to undefined, so any logic depending ' +
    'on it silently takes the wrong branch. The import chain from the client boundary is included in ' +
    'the finding.',
  severity: 'serious',
  docs: 'privacy-server-env-in-client-graph',
  standards: [PROPERTIES.originConfinement],
  fixtures: {
    // The finding lands in config.ts, which has no directive of its own;
    // triggering-client.tsx is the boundary that drags it into the browser.
    triggering: ['fixtures/privacy/server-env-in-client-graph/config.ts'],
    clean: ['fixtures/privacy/server-env-in-client-graph/clean-server.ts'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      if (!ctx.isClientReachable(file)) continue

      for (const { name, node } of envReads(file)) {
        if (name.startsWith('NEXT_PUBLIC_')) continue
        if (CLIENT_SAFE.has(name)) continue

        const chain = ctx.clientGraph.pathToRoot(file.getFilePath())
        const via =
          chain.length > 1
            ? ` This module reaches the browser through ${chain.slice().reverse().join(' → ')}.`
            : ''

        findings.push({
          message:
            `\`process.env.${name}\` is read in a module that ships to the browser, where it evaluates ` +
            `to undefined.${via}`,
          location: locationOf(node, ctx.rootDir),
          evidence: excerpt(node, 120),
          help:
            'Read this variable on the server and pass the result down as a prop, or move the code that ' +
            'needs it out of the client graph. Prefixing it NEXT_PUBLIC_ publishes it to every visitor ' +
            'and is only correct if the value is not sensitive.',
          surface: ctx.relative(file),
          boundary: {
            subject: `process.env.${name}`,
            from: 'server-only',
            to: 'evaluated in the browser',
          },
        })
      }
    }

    return findings
  },
}

export default rule
