import { Node } from 'ts-morph'
import type { RawFinding, Rule } from '@attestci/core'
import {
  excerpt,
  getJsxTags,
  getStaticAttributeValue,
  hasAttribute,
  hasSpreadAttributes,
  isTag,
  locationOf,
  tagName,
  type JsxTag,
  type StaticContext,
} from '@attestci/core/static'
import { WCAG } from '../../wcag.js'

/**
 * A form control with nothing that could ever label it.
 *
 * The bar for reporting is deliberately high: no id, no aria-label,
 * no aria-labelledby, no title, no spread props, and not wrapped in a <label>
 * in this file. A control in that state cannot be labelled by anything,
 * anywhere, so the finding is safe to make from one file.
 *
 * The case this rule does NOT report is a control with an id whose <label> is
 * in another component. Proving that association needs the render tree, which
 * is what the runtime scan is for. Reporting it from source would produce false
 * positives on every design system that splits Field and Input, which is most
 * of them.
 */

const CONTROLS = ['input', 'select', 'textarea']

/** Input types that are labelled by their own value or need no label. */
const SELF_LABELLING = new Set(['submit', 'button', 'reset', 'image', 'hidden'])

const rule: Rule<StaticContext> = {
  id: 'a11y/label-association',
  kind: 'static-a11y',
  title: 'Form control cannot be labelled',
  description:
    'A form control has no id, no aria-label, no aria-labelledby, no title, and is not wrapped in a ' +
    'label. Nothing in any file can associate a label with it, so its purpose is never announced and ' +
    'clicking the visible caption does not move focus to it. A placeholder does not count: it is ' +
    'removed as soon as the field has a value.',
  severity: 'serious',
  docs: 'a11y-label-association',
  standards: [WCAG.infoAndRelationships, WCAG.labelsOrInstructions, WCAG.nameRoleValue],
  fixtures: {
    triggering: ['fixtures/a11y-static/label-association/triggering.tsx'],
    clean: [
      'fixtures/a11y-static/label-association/clean.tsx',
      // Capitalised names are components, not DOM elements.
      'fixtures/a11y-static/label-association/clean-wrappers.tsx',
    ],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      for (const tag of getJsxTags(file)) {
        if (!isTag(tag, ...CONTROLS)) continue
        if (hasSpreadAttributes(tag)) continue

        const type = getStaticAttributeValue(tag, 'type')
        if (isTag(tag, 'input') && type && SELF_LABELLING.has(type)) continue

        if (
          hasAttribute(tag, 'id') ||
          hasAttribute(tag, 'aria-label') ||
          hasAttribute(tag, 'aria-labelledby') ||
          hasAttribute(tag, 'title')
        ) {
          continue
        }
        if (isWrappedInLabel(tag)) continue

        const placeholder = getStaticAttributeValue(tag, 'placeholder')
        findings.push({
          message:
            `This <${tagName(tag)}> has no id and no accessible name, so no <label> can be associated ` +
            `with it.` + (placeholder ? ` The placeholder "${placeholder}" is not a label.` : ''),
          location: locationOf(tag, ctx.rootDir),
          evidence: excerpt(tag, 160),
          help:
            'Give the control an id and point a <label htmlFor> at it, wrap it in a <label>, or set ' +
            'aria-label when there is no visible caption.',
          surface: ctx.relative(file),
        })
      }
    }

    return findings
  },
}

function isWrappedInLabel(tag: JsxTag): boolean {
  let current: Node | undefined = tag.getParent()
  while (current) {
    if (Node.isJsxElement(current)) {
      if (tagName(current.getOpeningElement()) === 'label') return true
    }
    current = current.getParent()
  }
  return false
}

export default rule
