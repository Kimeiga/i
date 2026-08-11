import { Node, SyntaxKind, type Statement } from 'ts-morph'
import type { RawFinding, Rule } from '@attestci/core'
import type { StaticContext } from '@attestci/core/static'
import { excerpt, locationOf } from '@attestci/core/static'
import { PROPERTIES } from '../standards.js'
import { boundNames, referencedIdentifiers } from '../helpers.js'

/**
 * Two server-side fetches awaited one after another when neither needs the
 * other's result.
 *
 * Each one costs a full round trip, and the page cannot start rendering until
 * both have returned. `Promise.all` makes the same code cost one round trip.
 * This is the single most common avoidable latency bug in App Router
 * codebases, and it is invisible in a diff — the second `await` looks exactly
 * like the first.
 *
 * The dependency test is what keeps this honest: if the second call references
 * anything the first bound, the sequence is required and there is no finding.
 */

const FETCH_SHAPES = [
  /^fetch$/,
  /^(get|fetch|load|query|find|list|read|search)[A-Z_]/,
  /\.(findFirst|findUnique|findMany|select|query|get|list)\b/,
]

const rule: Rule<StaticContext> = {
  id: 'client/sequential-server-fetch',
  kind: 'client-impact',
  title: 'Independent server fetches awaited sequentially',
  description:
    'Two or more data fetches in the same server function are awaited one after another even though ' +
    'the later ones do not use the earlier results. Each await adds a full round trip to time-to-first- ' +
    'byte. Awaiting them together with Promise.all costs one round trip instead of several.',
  severity: 'moderate',
  docs: 'client-sequential-server-fetch',
  standards: [PROPERTIES.deliveryCost],
  fixtures: {
    triggering: ['fixtures/client/sequential-server-fetch/triggering.ts'],
    clean: ['fixtures/client/sequential-server-fetch/clean.ts'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      // A waterfall in the browser is a different (and more visible) problem;
      // this rule is about time-to-first-byte on the server.
      if (ctx.isClientReachable(file)) continue

      for (const fn of functionLikeNodes(file)) {
        const body = fn.getBody()
        if (!body || !Node.isBlock(body)) continue

        const statements = body.getStatements()
        for (let i = 0; i < statements.length - 1; i++) {
          const first = statements[i]!
          const second = statements[i + 1]!

          const firstAwait = awaitedDataCall(first)
          const secondAwait = awaitedDataCall(second)
          if (!firstAwait || !secondAwait) continue

          const bound = boundNames(first)
          const referenced = referencedIdentifiers(secondAwait)
          const dependsOnFirst = [...bound].some((name) => referenced.has(name))
          if (dependsOnFirst) continue

          findings.push({
            message:
              `\`${firstAwait.getText().slice(0, 40)}…\` and \`${secondAwait.getText().slice(0, 40)}…\` ` +
              `are awaited in sequence but neither uses the other's result, so the page waits for two ` +
              `round trips instead of one.`,
            location: locationOf(second, ctx.rootDir),
            evidence: excerpt(second, 160),
            help: 'Start both before awaiting either, or await them together with Promise.all.',
            surface: ctx.relative(file),
          })
          // One finding per function is enough; a chain of five sequential
          // awaits is one problem, not four.
          break
        }
      }
    }

    return findings
  },
}

function functionLikeNodes(file: Parameters<StaticContext['relative']>[0]) {
  return [
    ...file.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),
    ...file.getDescendantsOfKind(SyntaxKind.ArrowFunction),
    ...file.getDescendantsOfKind(SyntaxKind.FunctionExpression),
    ...file.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
  ].filter((fn) => fn.isAsync())
}

/** The awaited expression when the statement awaits something fetch-shaped. */
function awaitedDataCall(statement: Statement): Node | undefined {
  const awaits = statement.getDescendantsOfKind(SyntaxKind.AwaitExpression)
  if (awaits.length !== 1) return undefined
  const expression = awaits[0]!.getExpression()

  // `await Promise.all([...])` is the fix, not the problem.
  const text = expression.getText()
  if (/^Promise\.(all|allSettled|race)\b/.test(text)) return undefined
  if (!Node.isCallExpression(expression)) return undefined

  const callee = expression.getExpression().getText()
  return FETCH_SHAPES.some((shape) => shape.test(callee)) ? expression : undefined
}

export default rule
