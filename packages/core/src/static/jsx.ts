import { Node, SyntaxKind, type JsxAttribute, type JsxElement, type JsxSelfClosingElement, type JsxOpeningElement, type SourceFile } from 'ts-morph'
import type { SourceLocation } from '../types.js'
import { toRelative } from './project.js'

/**
 * JSX reading helpers.
 *
 * Every rule that inspects markup goes through these, for one reason: a rule
 * that hand-rolls attribute lookup will forget spread props, and a rule that
 * forgets spread props reports `<Button {...a11yProps} />` as missing a label.
 * That is the false positive that gets a tool uninstalled, so the handling
 * lives here once rather than in each rule.
 */

export type JsxTag = JsxOpeningElement | JsxSelfClosingElement

export function getJsxTags(file: SourceFile): JsxTag[] {
  return [
    ...file.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...file.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ]
}

export function tagName(tag: JsxTag): string {
  return tag.getTagNameNode().getText()
}

/** `div`, `input` — as opposed to `<Button/>`, a component. */
export function isHtmlTag(tag: JsxTag): boolean {
  const name = tagName(tag)
  return /^[a-z][a-z0-9]*$/.test(name)
}

export function isTag(tag: JsxTag, ...names: string[]): boolean {
  const name = tagName(tag).toLowerCase()
  return names.some((n) => n.toLowerCase() === name)
}

export function getAttribute(tag: JsxTag, name: string): JsxAttribute | undefined {
  for (const attr of tag.getAttributes()) {
    if (Node.isJsxAttribute(attr) && attr.getNameNode().getText() === name) return attr
  }
  return undefined
}

export function hasAttribute(tag: JsxTag, name: string): boolean {
  return getAttribute(tag, name) !== undefined
}

/** True when any `{...props}` appears, meaning attributes cannot be enumerated. */
export function hasSpreadAttributes(tag: JsxTag): boolean {
  return tag.getAttributes().some((a) => Node.isJsxSpreadAttribute(a))
}

/**
 * The attribute's value when it is a literal we can read, otherwise undefined.
 * `undefined` means "not statically known", which is different from absent —
 * callers that treat them the same will produce false positives.
 */
export function getStaticAttributeValue(tag: JsxTag, name: string): string | undefined {
  const attr = getAttribute(tag, name)
  if (!attr) return undefined
  const init = attr.getInitializer()
  // `<input disabled />` — a bare attribute is `true`.
  if (init === undefined) return 'true'
  if (Node.isStringLiteral(init)) return init.getLiteralValue()
  if (Node.isJsxExpression(init)) {
    const expr = init.getExpression()
    if (!expr) return undefined
    if (Node.isStringLiteral(expr) || Node.isNoSubstitutionTemplateLiteral(expr)) {
      return expr.getLiteralValue()
    }
    if (expr.getKind() === SyntaxKind.TrueKeyword) return 'true'
    if (expr.getKind() === SyntaxKind.FalseKeyword) return 'false'
  }
  return undefined
}

/** True when the attribute is present with any value other than `false`/`""`. */
export function attributeIsTruthy(tag: JsxTag, name: string): boolean {
  const attr = getAttribute(tag, name)
  if (!attr) return false
  const value = getStaticAttributeValue(tag, name)
  if (value === undefined) return true // dynamic; assume present
  return value !== 'false' && value !== ''
}

export function getNumericAttributeValue(tag: JsxTag, name: string): number | undefined {
  const attr = getAttribute(tag, name)
  if (!attr) return undefined
  const init = attr.getInitializer()
  if (Node.isStringLiteral(init)) {
    const n = Number(init.getLiteralValue())
    return Number.isFinite(n) ? n : undefined
  }
  if (Node.isJsxExpression(init)) {
    const expr = init.getExpression()
    if (expr && Node.isNumericLiteral(expr)) return expr.getLiteralValue()
    if (expr && Node.isPrefixUnaryExpression(expr)) {
      const operand = expr.getOperand()
      if (Node.isNumericLiteral(operand) && expr.getOperatorToken() === SyntaxKind.MinusToken) {
        return -operand.getLiteralValue()
      }
    }
  }
  return undefined
}

/** The enclosing `<a>…</a>` element for an opening tag, when there is one. */
export function elementOf(tag: JsxTag): JsxElement | JsxSelfClosingElement {
  if (Node.isJsxSelfClosingElement(tag)) return tag
  const parent = tag.getParent()
  return Node.isJsxElement(parent) ? parent : (tag as unknown as JsxSelfClosingElement)
}

/**
 * Visible text inside an element, ignoring elements marked `aria-hidden`.
 * Returns `undefined` when the content is dynamic and cannot be read, so
 * callers can distinguish "empty" from "unknown".
 */
export function staticTextContent(node: Node): string | undefined {
  if (!Node.isJsxElement(node)) return ''
  let text = ''
  let dynamic = false

  for (const child of node.getJsxChildren()) {
    if (Node.isJsxText(child)) {
      text += child.getLiteralText()
      continue
    }
    if (Node.isJsxExpression(child)) {
      const expr = child.getExpression()
      if (!expr) continue
      if (Node.isStringLiteral(expr) || Node.isNoSubstitutionTemplateLiteral(expr)) {
        text += expr.getLiteralValue()
      } else {
        dynamic = true
      }
      continue
    }
    if (Node.isJsxElement(child) || Node.isJsxSelfClosingElement(child)) {
      const inner = Node.isJsxElement(child) ? child.getOpeningElement() : child
      if (attributeIsTruthy(inner, 'aria-hidden')) continue
      const nested = staticTextContent(child)
      if (nested === undefined) dynamic = true
      else text += nested
    }
  }

  if (text.trim().length > 0) return text.trim()
  return dynamic ? undefined : ''
}

/** Direct and nested JSX tags inside an element, excluding the element itself. */
export function descendantTags(node: Node): JsxTag[] {
  return [
    ...node.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...node.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ].filter((t) => t !== node)
}

export function locationOf(node: Node, rootDir: string): SourceLocation {
  const file = node.getSourceFile()
  const start = file.getLineAndColumnAtPos(node.getStart())
  const end = file.getLineAndColumnAtPos(node.getEnd())
  return {
    kind: 'source',
    file: toRelative(rootDir, file.getFilePath()),
    line: start.line,
    column: start.column,
    endLine: end.line,
    endColumn: end.column,
  }
}

/** Short, single-line excerpt of a node for the evidence field. */
export function excerpt(node: Node, max = 160): string {
  const text = node.getText().replace(/\s+/g, ' ').trim()
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
}

/** Name of the component function a node sits inside, for nicer surfaces. */
export function enclosingComponentName(node: Node): string | undefined {
  let current: Node | undefined = node
  while (current) {
    if (Node.isFunctionDeclaration(current)) {
      const name = current.getName()
      if (name && /^[A-Z]/.test(name)) return name
    }
    if (Node.isVariableDeclaration(current)) {
      const name = current.getName()
      if (/^[A-Z]/.test(name)) return name
    }
    if (Node.isClassDeclaration(current)) {
      const name = current.getName()
      if (name && /^[A-Z]/.test(name)) return name
    }
    current = current.getParent()
  }
  return undefined
}
