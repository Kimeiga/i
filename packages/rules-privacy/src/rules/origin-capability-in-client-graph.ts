import type { RawFinding, Rule } from '@attestci/core'
import type { StaticContext } from '@attestci/core/static'
import { excerpt, locationOf } from '@attestci/core/static'
import { PROPERTIES } from '../standards.js'

/**
 * Origin-only capabilities reachable from the browser bundle.
 *
 * Next.js already errors when a client component imports `server-only`
 * directly, and we deliberately do not claim credit for that case. What it does
 * not tell you is the transitive one: a helper that imports `@prisma/client`
 * becomes browser-bound the moment some component four hops up gains a
 * `'use client'` directive, and the failure surfaces as a confusing bundler
 * error or a bundle that silently balloons with polyfills.
 *
 * The finding always names the import chain, because "this file is in the
 * client graph" is not actionable without knowing why it is.
 */

interface Capability {
  /** Matched against the import specifier. */
  test: (specifier: string) => boolean
  label: string
}

const CAPABILITIES: Capability[] = [
  { test: (s) => s === 'server-only', label: 'the server-only marker' },
  {
    test: (s) => /^(node:)?(fs|child_process|net|dns|tls|cluster|worker_threads|v8|vm|perf_hooks)(\/|$)/.test(s),
    label: 'a Node.js runtime capability',
  },
  {
    test: (s) => /^(pg|mysql|mysql2|mongodb|mongoose|redis|ioredis|better-sqlite3|sqlite3|cassandra-driver)$/.test(s),
    label: 'a database driver',
  },
  { test: (s) => /^(@prisma\/client|drizzle-orm\/(node-postgres|mysql2|better-sqlite3)|typeorm|sequelize)$/.test(s), label: 'a database client' },
  { test: (s) => /^(nodemailer|@sendgrid\/mail|postmark)$/.test(s), label: 'a mail transport' },
  { test: (s) => /^(bcrypt|bcryptjs|argon2|@node-rs\/argon2)$/.test(s), label: 'a password hashing library' },
  { test: (s) => /^(jsonwebtoken|jose\/sign|@aws-sdk\/credential-providers)$/.test(s), label: 'a credential or signing library' },
]

const rule: Rule<StaticContext> = {
  id: 'privacy/origin-capability-in-client-graph',
  kind: 'static-privacy',
  title: 'Server-only capability reachable from the browser bundle',
  description:
    'A module reachable from a "use client" boundary imports something that only works, or only ' +
    'belongs, on the server: a Node.js builtin, a database driver, a mail transport, or a credential ' +
    'library. The finding names the import chain that puts it in the client graph.',
  severity: 'critical',
  docs: 'privacy-origin-capability-in-client-graph',
  standards: [PROPERTIES.originConfinement],
  fixtures: {
    triggering: ['fixtures/privacy/origin-capability-in-client-graph/db.ts'],
    clean: ['fixtures/privacy/origin-capability-in-client-graph/clean-server.ts'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      if (!ctx.isClientReachable(file)) continue

      for (const declaration of file.getImportDeclarations()) {
        const specifier = declaration.getModuleSpecifierValue()
        const capability = CAPABILITIES.find((c) => c.test(specifier))
        if (!capability) continue

        const chain = ctx.clientGraph.pathToRoot(file.getFilePath())
        const via =
          chain.length > 1
            ? ` Reached from the browser through ${chain.slice().reverse().join(' → ')}.`
            : ' This module carries a "use client" directive itself.'

        findings.push({
          message: `\`${specifier}\` is ${capability.label} and this module ships to the browser.${via}`,
          location: locationOf(declaration, ctx.rootDir),
          evidence: excerpt(declaration, 140),
          help:
            'Split the module: keep the server capability in a file that no client module imports, and ' +
            'expose what the browser needs through a server action, a route handler, or props.',
          surface: ctx.relative(file),
          boundary: {
            subject: specifier,
            from: 'server-only capability',
            to: 'reachable from the client bundle',
          },
        })
      }
    }

    return findings
  },
}

export default rule
