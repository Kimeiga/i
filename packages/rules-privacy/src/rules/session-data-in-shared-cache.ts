import { Node, SyntaxKind, type CallExpression } from 'ts-morph'
import type { RawFinding, Rule } from '@attestci/core'
import type { StaticContext } from '@attestci/core/static'
import { excerpt, locationOf } from '@attestci/core/static'
import { PROPERTIES } from '../standards.js'
import {
  callsNamed,
  getProperty,
  hasPropertyKey,
  literalNumber,
  literalString,
  subjectFromUrl,
} from '../helpers.js'

/**
 * Session-scoped data entering a shared cache.
 *
 * This is the rule the product exists for. Next.js's Data Cache is keyed by URL
 * and options and is shared across every visitor. A `fetch` that sends a
 * per-user credential AND asks to be cached puts one user's response where the
 * next user's request will find it. Nothing in the type system, in ESLint, in
 * `next lint`, or in axe sees this; it fails silently and correctly in
 * development, where there is one user.
 *
 * The detection is deliberately narrow — both a caching directive and a
 * per-session credential on the same call — because the cost of a false
 * positive here is high: it accuses the developer of leaking customer data.
 */

interface CacheSignal {
  description: string
  node: Node
}

function cacheSignal(options: Node): CacheSignal | undefined {
  if (!Node.isObjectLiteralExpression(options)) return undefined

  const cache = getProperty(options, 'cache')
  if (cache) {
    const value = literalString(cache)
    if (value === 'force-cache') return { description: `cache: 'force-cache'`, node: cache }
  }

  const next = getProperty(options, 'next')
  if (next && Node.isObjectLiteralExpression(next)) {
    const revalidate = getProperty(next, 'revalidate')
    if (revalidate) {
      const seconds = literalNumber(revalidate)
      // `revalidate: 0` opts out of caching, so it is not a signal.
      if (seconds !== undefined && seconds > 0) {
        return { description: `next: { revalidate: ${seconds} }`, node: revalidate }
      }
      if (seconds === undefined && !Node.isIdentifier(revalidate)) {
        return { description: 'next: { revalidate: … }', node: revalidate }
      }
    }
    if (hasPropertyKey(next, 'tags')) {
      return { description: 'next: { tags: [...] }', node: next }
    }
  }

  return undefined
}

const SESSION_HEADERS = ['authorization', 'cookie', 'x-api-key', 'proxy-authorization']
const SESSION_SOURCES = /\b(cookies|headers|auth|getSession|getServerSession|getToken|currentUser|session)\s*\(/

interface SessionSignal {
  description: string
  node: Node
}

function sessionSignal(options: Node): SessionSignal | undefined {
  if (!Node.isObjectLiteralExpression(options)) return undefined

  const headers = getProperty(options, 'headers')
  if (headers) {
    if (Node.isObjectLiteralExpression(headers)) {
      for (const name of SESSION_HEADERS) {
        if (hasPropertyKey(headers, name)) {
          return { description: `a ${name} header`, node: headers }
        }
      }
    }
    // `headers: await headers()` or `headers: buildAuthHeaders(session)`
    if (SESSION_SOURCES.test(headers.getText())) {
      return { description: 'headers derived from the current session', node: headers }
    }
  }

  const credentials = getProperty(options, 'credentials')
  if (credentials && literalString(credentials) === 'include') {
    return { description: `credentials: 'include'`, node: credentials }
  }

  return undefined
}

function urlOf(call: CallExpression): string | undefined {
  const first = call.getArguments()[0]
  return first ? literalString(first) : undefined
}

const rule: Rule<StaticContext> = {
  id: 'privacy/session-data-in-shared-cache',
  kind: 'static-privacy',
  title: 'Session-scoped response stored in a shared cache',
  description:
    'A fetch that sends a per-session credential and also carries a caching directive stores its ' +
    'response in the Next.js Data Cache, which is shared across all visitors and keyed by URL and ' +
    'request options rather than by user. The next visitor to request the same URL can be served the ' +
    "first visitor's data. This fails silently in development, where there is only one user.",
  severity: 'critical',
  docs: 'privacy-session-data-in-shared-cache',
  standards: [PROPERTIES.sessionScopeIsolation],
  fixtures: {
    triggering: ['fixtures/privacy/session-data-in-shared-cache/triggering.ts'],
    clean: ['fixtures/privacy/session-data-in-shared-cache/clean.ts'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      // A client-side fetch uses the browser's own cache, which is already
      // per-user. The shared Data Cache only exists on the server.
      if (ctx.isClientReachable(file)) continue

      for (const call of callsNamed(file, ['fetch'])) {
        const options = call.getArguments()[1]
        if (!options) continue

        const cache = cacheSignal(options)
        if (!cache) continue
        const session = sessionSignal(options)
        if (!session) continue

        const url = urlOf(call)
        const subject =
          subjectFromUrl(url) ??
          call.getFirstAncestorByKind(SyntaxKind.VariableDeclaration)?.getName() ??
          'this response'

        findings.push({
          message:
            `\`${subject}\` is fetched with ${session.description} and ${cache.description}, ` +
            `which stores the response in the shared Data Cache.`,
          location: locationOf(call, ctx.rootDir),
          evidence: excerpt(call, 200),
          help:
            'Remove the caching directive from this request, or move the per-user part of the response ' +
            'out of the cached fetch. If the response really is safe to share, fetch it without the ' +
            'credential.',
          surface: surfaceFor(ctx, file, subject),
          boundary: {
            subject,
            from: 'session-private',
            to: 'reachable from shared cache',
          },
        })
      }
    }

    return findings
  },
}

function surfaceFor(ctx: StaticContext, file: Parameters<StaticContext['relative']>[0], subject: string): string {
  const relative = ctx.relative(file)
  const base = relative.replace(/\.[cm]?[jt]sx?$/, '').split('/').slice(-2).join('/')
  return subject === 'this response' ? base : `${base} (${subject})`
}

export default rule
