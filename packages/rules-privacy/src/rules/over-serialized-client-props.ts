import { Node, SyntaxKind } from 'ts-morph'
import type { RawFinding, Rule } from '@attestci/core'
import type { StaticContext } from '@attestci/core/static'
import { excerpt, getJsxTags, getAttribute, locationOf, tagName } from '@attestci/core/static'
import { PROPERTIES } from '../standards.js'

/**
 * A whole database record handed to a client component.
 *
 * Everything passed as a prop across the server/client boundary is serialised
 * into the HTML payload, in full, visible in view-source. Passing `user` when
 * the component needs `user.name` publishes the password hash, the internal
 * flags, and whatever the next migration adds to that table.
 *
 * Marked experimental, and off by default. Recognising "this identifier holds a
 * database record" from syntax alone is a heuristic: it keys off the shape of
 * the query call that produced the value, and a codebase with a different data
 * layer will either escape it entirely or trip it on something harmless.
 * Shipping it loud would be the sort of false positive that gets a tool deleted,
 * so it ships quiet and honest instead.
 */

const QUERY_SHAPES = [
  /\.find(First|Unique|Many)\s*\(/,
  /\.select\s*\(/,
  /\bdb\.query\b/,
  /\bprisma\.\w+\.\w+\s*\(/,
  /\bknex\s*\(/,
]

const rule: Rule<StaticContext> = {
  id: 'privacy/over-serialized-client-props',
  kind: 'static-privacy',
  title: 'Whole database record passed across the client boundary',
  description:
    'A value that appears to come straight from a database query is passed as a prop to a client ' +
    'component. Props crossing that boundary are serialised into the HTML in full, so every column on ' +
    'the record — including ones added later — is published to the browser.',
  severity: 'serious',
  docs: 'privacy-over-serialized-client-props',
  standards: [PROPERTIES.originConfinement],
  experimental: true,
  fixtures: {
    triggering: ['fixtures/privacy/over-serialized-client-props/triggering.tsx'],
    clean: ['fixtures/privacy/over-serialized-client-props/clean.tsx'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      // Only the server side of the boundary matters: a client component
      // passing props to another client component serialises nothing.
      if (ctx.isClientReachable(file)) continue

      const recordNames = recordVariables(file)
      if (recordNames.size === 0) continue

      const clientComponents = importedClientComponents(ctx, file)
      if (clientComponents.size === 0) continue

      for (const tag of getJsxTags(file)) {
        const component = tagName(tag)
        if (!clientComponents.has(component)) continue

        for (const attribute of tag.getAttributes()) {
          if (!Node.isJsxAttribute(attribute)) continue
          const initializer = attribute.getInitializer()
          if (!initializer || !Node.isJsxExpression(initializer)) continue
          const expression = initializer.getExpression()
          if (!expression || !Node.isIdentifier(expression)) continue
          const name = expression.getText()
          if (!recordNames.has(name)) continue

          findings.push({
            message:
              `\`${name}\` looks like a database record and is passed whole to the client component ` +
              `\`${component}\`, which serialises every field of it into the HTML.`,
            location: locationOf(attribute, ctx.rootDir),
            evidence: excerpt(tag, 160),
            help:
              'Pass only the fields the component renders, or map the record to a view model on the ' +
              'server first.',
            surface: ctx.relative(file),
            boundary: {
              subject: name,
              from: 'server-side record',
              to: 'serialised into the HTML payload',
            },
          })
        }
      }
    }

    return findings
  },
}

/** Variables initialised from something that looks like a database query. */
function recordVariables(file: Parameters<StaticContext['relative']>[0]): Set<string> {
  const out = new Set<string>()
  for (const declaration of file.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
    const initializer = declaration.getInitializer()
    if (!initializer) continue
    const text = initializer.getText()
    if (!QUERY_SHAPES.some((shape) => shape.test(text))) continue
    const nameNode = declaration.getNameNode()
    if (Node.isIdentifier(nameNode)) out.add(nameNode.getText())
  }
  return out
}

/** Component identifiers imported from modules that carry `'use client'`. */
function importedClientComponents(
  ctx: StaticContext,
  file: Parameters<StaticContext['relative']>[0],
): Set<string> {
  const out = new Set<string>()
  for (const declaration of file.getImportDeclarations()) {
    const target = declaration.getModuleSpecifierSourceFile()
    if (!target || !ctx.isClientBoundary(target)) continue
    const defaultImport = declaration.getDefaultImport()
    if (defaultImport) out.add(defaultImport.getText())
    for (const named of declaration.getNamedImports()) out.add(named.getName())
  }
  return out
}

export default rule
