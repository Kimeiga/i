import { Node } from 'ts-morph'
import type { RawFinding, Rule } from '@attestci/core'
import {
  attributeIsTruthy,
  descendantTags,
  elementOf,
  excerpt,
  getJsxTags,
  getNumericAttributeValue,
  hasAttribute,
  isTag,
  locationOf,
  tagName,
  type JsxTag,
  type StaticContext,
} from '@attestci/core/static'
import { WCAG } from '../../wcag.js'

/**
 * Focus that lands somewhere a screen reader cannot follow.
 *
 * `aria-hidden="true"` removes a subtree from the accessibility tree but not
 * from the tab order. A keyboard user tabs into it and their screen reader goes
 * silent: focus is somewhere, and there is nothing to announce. It is one of
 * the most disorienting failures there is, and it usually arrives with a
 * decorative wrapper or a hidden-but-not-really modal.
 *
 * jsx-a11y checks the element carrying the attribute. This checks the subtree
 * under it, which is where the focusable thing actually is.
 */

const FOCUSABLE_TAGS = ['button', 'select', 'textarea', 'iframe', 'audio', 'video', 'details', 'summary']

const rule: Rule<StaticContext> = {
  id: 'a11y/aria-hidden-contains-focusable',
  kind: 'static-a11y',
  title: 'aria-hidden subtree contains a focusable element',
  description:
    'An element marked aria-hidden="true" contains something that can still receive keyboard focus. ' +
    'Tabbing into it moves focus to a control the screen reader cannot announce, so the user is left ' +
    'with focus somewhere silent.',
  severity: 'serious',
  docs: 'a11y-aria-hidden-contains-focusable',
  standards: [WCAG.nameRoleValue, WCAG.focusOrder],
  fixtures: {
    triggering: ['fixtures/a11y-static/aria-hidden-contains-focusable/triggering.tsx'],
    clean: ['fixtures/a11y-static/aria-hidden-contains-focusable/clean.tsx'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      for (const tag of getJsxTags(file)) {
        if (!attributeIsTruthy(tag, 'aria-hidden')) continue

        const element = elementOf(tag)
        if (!Node.isJsxElement(element)) continue

        const focusable = descendantTags(element).filter(isFocusable)
        if (focusable.length === 0) continue

        findings.push({
          message:
            `This aria-hidden element contains ${focusable.length} focusable ` +
            `${focusable.length === 1 ? 'element' : 'elements'} ` +
            `(${[...new Set(focusable.map((f) => `<${tagName(f)}>`))].join(', ')}), which stay in the ` +
            `tab order while being hidden from assistive technology.`,
          location: locationOf(tag, ctx.rootDir),
          evidence: excerpt(element, 200),
          help:
            'Remove aria-hidden and hide the subtree properly with `hidden` or `display: none`, or ' +
            'keep aria-hidden and take the contents out of the tab order with inert or tabindex="-1".',
          surface: ctx.relative(file),
        })
      }
    }

    return findings
  },
}

function isFocusable(tag: JsxTag): boolean {
  const tabIndex = getNumericAttributeValue(tag, 'tabIndex')
  if (tabIndex !== undefined) return tabIndex >= 0
  if (isTag(tag, 'a')) return hasAttribute(tag, 'href')
  if (isTag(tag, 'input')) return true
  return isTag(tag, ...FOCUSABLE_TAGS)
}

export default rule
