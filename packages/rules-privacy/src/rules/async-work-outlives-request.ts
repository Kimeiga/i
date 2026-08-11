import { Node, SyntaxKind, type Node as TsNode } from 'ts-morph'
import type { RawFinding, Rule } from '@attestci/core'
import type { StaticContext } from '@attestci/core/static'
import { excerpt, locationOf } from '@attestci/core/static'
import { PROPERTIES } from '../standards.js'
import { calleeName } from '../helpers.js'

/**
 * Work scheduled inside a request that the request does not wait for.
 *
 * On a serverless runtime the execution context is frozen or destroyed once the
 * response is returned. A `setTimeout` in a route handler, or a promise nobody
 * awaits, therefore runs sometimes: it works on a warm instance and vanishes on
 * a cold one. The bug reports read "some webhooks never arrive" and the code
 * looks correct.
 *
 * Scope is limited to route handlers and `'use server'` modules on purpose.
 * Floating promises in general are a style question with a well-known ESLint
 * rule; floating promises *in a request lifecycle* are a correctness question,
 * and that is the part worth a finding.
 */

const TIMERS = new Set(['setTimeout', 'setInterval', 'setImmediate'])

const rule: Rule<StaticContext> = {
  id: 'privacy/async-work-outlives-request',
  kind: 'static-privacy',
  title: 'Asynchronous work scheduled beyond the request lifetime',
  description:
    'A route handler or server action schedules work the response does not wait for — a timer, or a ' +
    'promise that is never awaited. Serverless runtimes freeze the execution context once the response ' +
    'is sent, so the work runs on a warm instance and is silently dropped on a cold one.',
  severity: 'moderate',
  docs: 'privacy-async-work-outlives-request',
  standards: [PROPERTIES.requestLifetime],
  fixtures: {
    triggering: ['fixtures/privacy/async-work-outlives-request/app/api/orders/route.ts'],
    clean: ['fixtures/privacy/async-work-outlives-request/app/api/clean/route.ts'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      const isRequestScope = ctx.isRouteHandler(file) || ctx.isServerActionModule(file)
      if (!isRequestScope) continue

      const scope = ctx.isRouteHandler(file) ? 'route handler' : 'server action'

      for (const call of file.getDescendantsOfKind(SyntaxKind.CallExpression)) {
        const name = calleeName(call)

        if (TIMERS.has(name)) {
          findings.push({
            message:
              `\`${name}\` schedules work that outlives this ${scope}. On a serverless runtime the ` +
              `execution context is frozen once the response is sent and the callback may never run.`,
            location: locationOf(call, ctx.rootDir),
            evidence: excerpt(call, 160),
            help:
              'Await the work before returning, or hand it to something that survives the request: a ' +
              'queue, a cron job, or the platform\'s own background-work primitive.',
            surface: ctx.relative(file),
          })
          continue
        }

        if (isFloatingAsyncCall(call)) {
          findings.push({
            message:
              `\`${name}(…)\` returns a promise that this ${scope} does not await, so the response can ` +
              `be sent before the work completes.`,
            location: locationOf(call, ctx.rootDir),
            evidence: excerpt(call, 160),
            help:
              'Await the call, return its promise, or move the work to a queue. If dropping it is ' +
              'intentional, mark it `void` so the intent is visible in review.',
            surface: ctx.relative(file),
          })
        }
      }
    }

    return findings
  },
}

/**
 * A call whose result is discarded, where the callee is a function we can see
 * is async. Resolving the declaration keeps this off synchronous helpers, which
 * is what separates it from a naive "unawaited call expression" check.
 */
function isFloatingAsyncCall(call: TsNode): boolean {
  if (!Node.isCallExpression(call)) return false
  const parent = call.getParent()
  if (!parent || !Node.isExpressionStatement(parent)) return false

  const callee = call.getExpression()
  if (!Node.isIdentifier(callee)) return false

  for (const declaration of callee.getDefinitionNodes()) {
    if (Node.isFunctionDeclaration(declaration) && declaration.isAsync()) return true
    if (Node.isVariableDeclaration(declaration)) {
      const init = declaration.getInitializer()
      if (init && (Node.isArrowFunction(init) || Node.isFunctionExpression(init)) && init.isAsync()) {
        return true
      }
    }
  }
  return false
}

export default rule
