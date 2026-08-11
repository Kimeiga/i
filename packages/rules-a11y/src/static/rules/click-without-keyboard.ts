import type { RawFinding, Rule } from '@attestci/core'
import {
  excerpt,
  getJsxTags,
  getStaticAttributeValue,
  hasAttribute,
  hasSpreadAttributes,
  isHtmlTag,
  isTag,
  locationOf,
  tagName,
  type StaticContext,
} from '@attestci/core/static'
import { WCAG } from '../../wcag.js'

/**
 * A control only a mouse can operate.
 *
 * A click handler on a <div> is invisible to the keyboard: no focus, no Enter,
 * no Space. It is the single most common way a working feature becomes
 * unusable for someone who cannot use a pointer, and it survives review because
 * it looks and behaves correctly for the reviewer.
 *
 * Elements that already carry a keyboard handler, or that are natively
 * interactive, are not reported — the point is the gap, not the pattern.
 */

const NATIVELY_INTERACTIVE = new Set([
  'button', 'input', 'select', 'textarea', 'option', 'summary', 'details', 'label', 'form',
])

const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'menuitemcheckbox',
  'menuitemradio', 'option', 'slider', 'spinbutton', 'textbox', 'combobox', 'searchbox',
])

const KEYBOARD_HANDLERS = ['onKeyDown', 'onKeyUp', 'onKeyPress']

const rule: Rule<StaticContext> = {
  id: 'a11y/click-without-keyboard',
  kind: 'static-a11y',
  title: 'Click handler on an element the keyboard cannot reach',
  description:
    'A non-interactive element has an onClick handler but no keyboard handler, and is not exposed as ' +
    'an interactive control. Keyboard and switch users cannot focus it or activate it at all. ' +
    'jsx-a11y covers similar ground with click-events-have-key-events; this rule additionally ignores ' +
    'elements that are already given an interactive role and a tab stop.',
  severity: 'serious',
  docs: 'a11y-click-without-keyboard',
  standards: [WCAG.keyboard, WCAG.nameRoleValue],
  fixtures: {
    triggering: ['fixtures/a11y-static/click-without-keyboard/triggering.tsx'],
    clean: ['fixtures/a11y-static/click-without-keyboard/clean.tsx'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      for (const tag of getJsxTags(file)) {
        // A component may implement keyboard support internally; only raw DOM
        // elements can be judged from here.
        if (!isHtmlTag(tag)) continue
        if (!hasAttribute(tag, 'onClick')) continue
        if (hasSpreadAttributes(tag)) continue

        const name = tagName(tag)
        if (NATIVELY_INTERACTIVE.has(name)) continue
        if (isTag(tag, 'a') && hasAttribute(tag, 'href')) continue
        if (KEYBOARD_HANDLERS.some((handler) => hasAttribute(tag, handler))) continue

        const role = getStaticAttributeValue(tag, 'role')
        const hasTabStop = hasAttribute(tag, 'tabIndex')
        // Role plus a tab stop plus a keyboard handler is the correct pattern;
        // we already returned above if a handler exists, so this is the
        // half-finished version and still worth reporting.
        const roleNote =
          role && INTERACTIVE_ROLES.has(role)
            ? ` It declares role="${role}"${hasTabStop ? ' and a tab stop' : ''} but handles no key events.`
            : ''

        findings.push({
          message: `<${name}> handles onClick but no key events, so it cannot be activated from a keyboard.${roleNote}`,
          location: locationOf(tag, ctx.rootDir),
          evidence: excerpt(tag, 160),
          help:
            'Use a <button>, which gets focus, Enter and Space for free. If the element must stay a ' +
            `<${name}>, add role, tabIndex={0} and an onKeyDown that responds to Enter and Space.`,
          surface: ctx.relative(file),
        })
      }
    }

    return findings
  },
}

export default rule
