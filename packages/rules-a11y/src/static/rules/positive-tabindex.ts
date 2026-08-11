import type { RawFinding, Rule } from '@attestci/core'
import {
  excerpt,
  getJsxTags,
  getNumericAttributeValue,
  locationOf,
  tagName,
  type StaticContext,
} from '@attestci/core/static'
import { WCAG } from '../../wcag.js'

/**
 * A tab order that no longer matches the page.
 *
 * Any positive tabindex pulls its element to the front of the document's tab
 * order, ahead of everything with tabindex="0" — including elements added later
 * by someone who has no idea this exists. It is almost always an attempt to fix
 * an ordering problem that would be better fixed by moving the markup.
 *
 * `jsx-a11y/tabindex-no-positive` covers the same ground and is a fine reason to
 * turn this off; the docs page says so.
 */

const rule: Rule<StaticContext> = {
  id: 'a11y/positive-tabindex',
  kind: 'static-a11y',
  title: 'Positive tabindex overrides the natural tab order',
  description:
    'An element declares tabindex greater than zero, which moves it ahead of every element with ' +
    'tabindex="0" regardless of where it appears on the page. The resulting order is invisible in the ' +
    'markup and breaks whenever anything is added.',
  severity: 'moderate',
  docs: 'a11y-positive-tabindex',
  standards: [WCAG.focusOrder],
  fixtures: {
    triggering: ['fixtures/a11y-static/positive-tabindex/triggering.tsx'],
    clean: ['fixtures/a11y-static/positive-tabindex/clean.tsx'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      for (const tag of getJsxTags(file)) {
        const tabIndex = getNumericAttributeValue(tag, 'tabIndex')
        if (tabIndex === undefined || tabIndex <= 0) continue

        findings.push({
          message:
            `<${tagName(tag)}> declares tabIndex={${tabIndex}}, which moves it ahead of everything ` +
            `with tabIndex 0 anywhere on the page.`,
          location: locationOf(tag, ctx.rootDir),
          evidence: excerpt(tag, 140),
          help:
            'Use tabIndex={0} and put the element where it belongs in the DOM. Reorder the markup, or ' +
            'reorder visually with CSS, rather than overriding the tab order.',
          surface: ctx.relative(file),
        })
      }
    }

    return findings
  },
}

export default rule
