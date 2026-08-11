import type { RawFinding, Rule } from '@attestci/core'
import type { StaticContext } from '@attestci/core/static'
import { excerpt, locationOf } from '@attestci/core/static'
import { PROPERTIES } from '../standards.js'
import { envReads } from '../helpers.js'

/**
 * A secret-shaped value published to the browser by naming convention.
 *
 * Anything prefixed `NEXT_PUBLIC_` is inlined into the JavaScript bundle at
 * build time and is readable by every visitor. Developers reach for the prefix
 * when a value comes back `undefined` in the browser, which is exactly the
 * moment they are least likely to ask whether it should be there.
 *
 * The name list is intentionally short. Half the `NEXT_PUBLIC_*_KEY` variables
 * in the world are publishable Stripe keys and Supabase anon keys that are
 * *designed* to be public, so matching on `KEY` alone would make this rule
 * fire on correct code in most repositories that have it.
 */

/** Strong signals only. Each one is a word that has no benign public meaning. */
const SECRET_WORDS = [
  'SECRET',
  'PRIVATE',
  'PASSWORD',
  'PASSWD',
  'CREDENTIAL',
  'SIGNING',
  'PRIVKEY',
  'SERVICE_ROLE',
  'SESSION_KEY',
  'ENCRYPTION_KEY',
  'ACCESS_TOKEN',
  'REFRESH_TOKEN',
  'API_SECRET',
]

/** Names that contain a secret word but are documented as public. */
const KNOWN_PUBLIC = [/PUBLISHABLE/, /_PUBLIC_KEY$/, /ANON_KEY$/, /PUBLIC_SIGNING_KEY$/]

const rule: Rule<StaticContext> = {
  id: 'privacy/public-env-secret',
  kind: 'static-privacy',
  title: 'Secret-shaped value exposed through a NEXT_PUBLIC_ variable',
  description:
    'Environment variables prefixed NEXT_PUBLIC_ are inlined into the client bundle at build time and ' +
    'are readable by anyone who loads the page. This rule reports names that contain an unambiguous ' +
    'secret word, such as SECRET, PASSWORD or SERVICE_ROLE.',
  severity: 'critical',
  docs: 'privacy-public-env-secret',
  standards: [PROPERTIES.originConfinement],
  fixtures: {
    triggering: ['fixtures/privacy/public-env-secret/triggering.ts'],
    clean: ['fixtures/privacy/public-env-secret/clean.ts'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      for (const { name, node } of envReads(file)) {
        if (!name.startsWith('NEXT_PUBLIC_')) continue
        if (KNOWN_PUBLIC.some((re) => re.test(name))) continue
        const matched = SECRET_WORDS.find((word) => name.includes(word))
        if (!matched) continue

        findings.push({
          message:
            `\`${name}\` is inlined into the client bundle because of its NEXT_PUBLIC_ prefix, and its ` +
            `name contains "${matched.replace(/_/g, ' ').toLowerCase()}".`,
          location: locationOf(node, ctx.rootDir),
          evidence: excerpt(node, 120),
          help:
            'Rename the variable without the NEXT_PUBLIC_ prefix and read it only on the server, or, if ' +
            'the value genuinely is public, rename it so its name says so.',
          surface: ctx.relative(file),
          boundary: {
            subject: name,
            from: 'server-only secret',
            to: 'inlined into the client bundle',
          },
        })
      }
    }

    return findings
  },
}

export default rule
