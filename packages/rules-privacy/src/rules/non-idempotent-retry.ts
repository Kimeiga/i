import { Node, SyntaxKind, type CallExpression } from 'ts-morph'
import type { RawFinding, Rule } from '@attestci/core'
import type { StaticContext } from '@attestci/core/static'
import { excerpt, locationOf } from '@attestci/core/static'
import { PROPERTIES } from '../standards.js'
import { calleeName, getProperty, hasPropertyKey, literalString, subjectFromUrl } from '../helpers.js'

/**
 * A non-idempotent request under automatic retry.
 *
 * A retry wrapper around a POST is a double charge waiting for a slow network.
 * The request succeeds at the origin, the response is lost, the wrapper retries,
 * and the customer is billed twice — and because it only happens under packet
 * loss, it never reproduces locally and is diagnosed as "a payments bug" months
 * later.
 *
 * An idempotency key makes the retry safe, which is why its presence is the
 * thing that clears the finding rather than the method itself.
 */

const RETRY_HELPERS = new Set([
  'retry',
  'pRetry',
  'asyncRetry',
  'withRetry',
  'retryAsync',
  'backOff',
  'exponentialBackoff',
  'retryable',
])

const UNSAFE_METHODS = new Set(['POST', 'PATCH', 'DELETE'])

const IDEMPOTENCY_HEADERS = ['idempotency-key', 'x-idempotency-key', 'x-request-id', 'idempotency_key']

const rule: Rule<StaticContext> = {
  id: 'privacy/non-idempotent-retry',
  kind: 'static-privacy',
  title: 'Non-idempotent request under automatic retry',
  description:
    'A POST, PATCH or DELETE is issued inside a retry wrapper without an idempotency key. When the ' +
    'origin processes the request but the response is lost, the retry repeats the effect: a duplicate ' +
    'charge, a duplicate order, a second email. This only happens under network failure, so it does ' +
    'not appear in testing.',
  severity: 'serious',
  docs: 'privacy-non-idempotent-retry',
  standards: [PROPERTIES.retrySafety],
  fixtures: {
    triggering: ['fixtures/privacy/non-idempotent-retry/triggering.ts'],
    clean: ['fixtures/privacy/non-idempotent-retry/clean.ts'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      for (const call of file.getDescendantsOfKind(SyntaxKind.CallExpression)) {
        if (!RETRY_HELPERS.has(calleeName(call))) continue

        for (const request of unsafeRequestsIn(call)) {
          const url = literalString(request.call.getArguments()[0] ?? request.call)
          const subject = subjectFromUrl(url) ?? calleeName(request.call)

          findings.push({
            message:
              `A ${request.method} to \`${subject}\` runs inside \`${calleeName(call)}(…)\` with no ` +
              `idempotency key, so a retry after a lost response repeats the effect.`,
            location: locationOf(request.call, ctx.rootDir),
            evidence: excerpt(request.call, 200),
            help:
              'Send an Idempotency-Key header generated once outside the retry loop, or move the retry ' +
              'to a step that is safe to repeat.',
            surface: ctx.relative(file),
          })
        }
      }
    }

    return findings
  },
}

interface UnsafeRequest {
  call: CallExpression
  method: string
}

function unsafeRequestsIn(retryCall: CallExpression): UnsafeRequest[] {
  const out: UnsafeRequest[] = []

  for (const call of retryCall.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    if (calleeName(call) !== 'fetch') continue
    const options = call.getArguments()[1]
    if (!options || !Node.isObjectLiteralExpression(options)) continue

    const methodNode = getProperty(options, 'method')
    const method = methodNode ? literalString(methodNode)?.toUpperCase() : undefined
    if (!method || !UNSAFE_METHODS.has(method)) continue

    const headers = getProperty(options, 'headers')
    if (headers && Node.isObjectLiteralExpression(headers)) {
      if (IDEMPOTENCY_HEADERS.some((h) => hasPropertyKey(headers, h))) continue
    } else if (headers && IDEMPOTENCY_HEADERS.some((h) => headers.getText().toLowerCase().includes(h))) {
      // Headers built elsewhere; if the key is mentioned anywhere in the
      // expression, give the developer the benefit of the doubt.
      continue
    }

    out.push({ call, method })
  }

  return out
}

export default rule
