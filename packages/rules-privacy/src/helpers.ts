import {
  Node,
  SyntaxKind,
  type CallExpression,
  type Expression,
  type ObjectLiteralExpression,
  type SourceFile,
} from 'ts-morph'

/** Shared syntax lookups. Kept here so rules stay short enough to read. */

export function callsNamed(file: SourceFile, names: readonly string[]): CallExpression[] {
  const wanted = new Set(names)
  return file.getDescendantsOfKind(SyntaxKind.CallExpression).filter((call) => {
    const callee = call.getExpression()
    if (Node.isIdentifier(callee)) return wanted.has(callee.getText())
    if (Node.isPropertyAccessExpression(callee)) return wanted.has(callee.getName())
    return false
  })
}

export function calleeName(call: CallExpression): string {
  const callee = call.getExpression()
  if (Node.isIdentifier(callee)) return callee.getText()
  if (Node.isPropertyAccessExpression(callee)) return callee.getName()
  return callee.getText()
}

export function objectArgument(call: CallExpression, index: number): ObjectLiteralExpression | undefined {
  const arg = call.getArguments()[index]
  return arg && Node.isObjectLiteralExpression(arg) ? arg : undefined
}

export function getProperty(obj: ObjectLiteralExpression, name: string): Expression | undefined {
  for (const prop of obj.getProperties()) {
    if (Node.isPropertyAssignment(prop)) {
      const key = propertyKey(prop.getNameNode())
      if (key !== undefined && key.toLowerCase() === name.toLowerCase()) return prop.getInitializer()
    }
    if (Node.isShorthandPropertyAssignment(prop) && prop.getName().toLowerCase() === name.toLowerCase()) {
      return prop.getNameNode() as unknown as Expression
    }
  }
  return undefined
}

export function getStringProperty(obj: ObjectLiteralExpression, name: string): string | undefined {
  const value = getProperty(obj, name)
  return value ? literalString(value) : undefined
}

export function hasPropertyKey(obj: ObjectLiteralExpression, name: string): boolean {
  return obj.getProperties().some((prop) => {
    if (Node.isPropertyAssignment(prop)) {
      const key = propertyKey(prop.getNameNode())
      return key !== undefined && key.toLowerCase() === name.toLowerCase()
    }
    if (Node.isShorthandPropertyAssignment(prop)) return prop.getName().toLowerCase() === name.toLowerCase()
    return false
  })
}

/** Property keys can be identifiers, string literals or computed. */
function propertyKey(node: Node): string | undefined {
  if (Node.isIdentifier(node)) return node.getText()
  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) return node.getLiteralValue()
  return undefined
}

export function literalString(node: Node): string | undefined {
  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) return node.getLiteralValue()
  if (Node.isTemplateExpression(node)) {
    // A template with interpolations still tells us the static parts, which is
    // enough to recognise `${base}/api/customer_profile`.
    return node.getText().replace(/[`]/g, '')
  }
  return undefined
}

export function literalNumber(node: Node): number | undefined {
  if (Node.isNumericLiteral(node)) return node.getLiteralValue()
  return undefined
}

/** All `process.env.NAME` reads, excluding computed `process.env[expr]`. */
export function envReads(file: SourceFile): Array<{ name: string; node: Node }> {
  const out: Array<{ name: string; node: Node }> = []

  for (const access of file.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)) {
    const target = access.getExpression()
    if (!Node.isPropertyAccessExpression(target)) continue
    if (target.getName() !== 'env') continue
    if (target.getExpression().getText() !== 'process') continue
    out.push({ name: access.getName(), node: access })
  }

  // `const { STRIPE_SECRET_KEY } = process.env`
  for (const decl of file.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
    const init = decl.getInitializer()
    if (!init || init.getText() !== 'process.env') continue
    const nameNode = decl.getNameNode()
    if (!Node.isObjectBindingPattern(nameNode)) continue
    for (const element of nameNode.getElements()) {
      const propertyName = element.getPropertyNameNode()?.getText() ?? element.getName()
      out.push({ name: propertyName, node: element })
    }
  }

  return out
}

/** The nearest enclosing function-ish node, for "which handler is this in". */
export function enclosingFunctionName(node: Node): string | undefined {
  let current: Node | undefined = node
  while (current) {
    if (Node.isFunctionDeclaration(current) || Node.isMethodDeclaration(current)) {
      const name = current.getName()
      if (name) return name
    }
    if (Node.isVariableDeclaration(current)) return current.getName()
    current = current.getParent()
  }
  return undefined
}

/** Identifiers a node reads, used to test whether one await depends on another. */
export function referencedIdentifiers(node: Node): Set<string> {
  const out = new Set<string>()
  for (const id of node.getDescendantsOfKind(SyntaxKind.Identifier)) out.add(id.getText())
  return out
}

/** Names bound by a variable statement, including destructuring patterns. */
export function boundNames(node: Node): Set<string> {
  const out = new Set<string>()
  if (Node.isVariableStatement(node)) {
    for (const decl of node.getDeclarationList().getDeclarations()) {
      const nameNode = decl.getNameNode()
      if (Node.isIdentifier(nameNode)) out.add(nameNode.getText())
      else for (const id of nameNode.getDescendantsOfKind(SyntaxKind.Identifier)) out.add(id.getText())
    }
  }
  return out
}

/** `https://api.example.com/v1/customer_profile` -> `customer_profile`. */
export function subjectFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  const withoutQuery = url.split('?')[0] ?? url
  const segments = withoutQuery.split('/').filter((s) => s.length > 0 && !s.includes('$') && !s.includes(':'))
  const last = segments[segments.length - 1]
  if (!last || last.includes('.') || /^https?$/.test(last)) return undefined
  return last
}
