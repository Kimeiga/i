import type { RawFinding, Rule } from '@attestci/core'
import {
  attributeIsTruthy,
  excerpt,
  getJsxTags,
  hasAttribute,
  hasSpreadAttributes,
  isTag,
  locationOf,
  tagName,
  type StaticContext,
} from '@attestci/core/static'
import { WCAG } from '../../wcag.js'

/**
 * A field marked invalid with no way to hear why.
 *
 * `aria-invalid` tells a screen reader the value is wrong. Without
 * `aria-describedby` or `aria-errormessage` pointing at the message, that is
 * all it says — the user is told something is wrong and not what. Sighted users
 * read the red text under the field; everyone else gets "invalid entry".
 *
 * Nothing else lints this. jsx-a11y has no rule for it, and axe cannot flag it
 * because a field with aria-invalid and no description is valid ARIA — it is
 * a usability failure against WCAG 3.3.1, not a markup error.
 */

const CONTROLS = ['input', 'select', 'textarea']

const rule: Rule<StaticContext> = {
  id: 'a11y/form-error-not-associated',
  kind: 'static-a11y',
  title: 'Invalid field has no associated error message',
  description:
    'A form control is marked aria-invalid but has neither aria-describedby nor aria-errormessage, so ' +
    'assistive technology announces that the value is wrong without saying what is wrong with it. The ' +
    'error text is usually right there on screen and simply not connected to the field.',
  severity: 'serious',
  docs: 'a11y-form-error-not-associated',
  standards: [WCAG.errorIdentification, WCAG.infoAndRelationships],
  fixtures: {
    triggering: ['fixtures/a11y-static/form-error-not-associated/triggering.tsx'],
    clean: ['fixtures/a11y-static/form-error-not-associated/clean.tsx'],
  },
  check(ctx: StaticContext): RawFinding[] {
    const findings: RawFinding[] = []

    for (const file of ctx.files) {
      for (const tag of getJsxTags(file)) {
        if (!isTag(tag, ...CONTROLS)) continue
        if (hasSpreadAttributes(tag)) continue
        if (!hasAttribute(tag, 'aria-invalid')) continue
        // `aria-invalid={false}` is the normal state, not an error state.
        if (!attributeIsTruthy(tag, 'aria-invalid')) continue
        if (hasAttribute(tag, 'aria-describedby') || hasAttribute(tag, 'aria-errormessage')) continue

        findings.push({
          message:
            `This <${tagName(tag)}> is marked aria-invalid but points at no message, so a screen ` +
            `reader announces that the value is invalid without saying why.`,
          location: locationOf(tag, ctx.rootDir),
          evidence: excerpt(tag, 160),
          help:
            'Give the error message an id and reference it from aria-describedby (or ' +
            'aria-errormessage) on the field. Render the message whenever the field is invalid, not ' +
            'only on submit.',
          surface: ctx.relative(file),
        })
      }
    }

    return findings
  },
}

export default rule
