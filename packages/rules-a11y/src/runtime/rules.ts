import type { Rule } from '@attestci/core'
import { axeRule } from './axe-rule.js'
import type { RuntimeA11yContext } from './context.js'
import { BEST_PRACTICE, WCAG } from '../wcag.js'

/**
 * The axe-core rules we surface, with our own severities and criterion
 * mappings.
 *
 * This is a curated subset, not all of axe. Two reasons. Every rule here has a
 * documented fix and a fixture pair, which is a real cost per rule; and a tool
 * that reports 90 rule types on first run gets closed. The set grows one rule
 * per session as real scans show which ones matter.
 */

const fixtures = (slug: string) => ({
  triggering: [`fixtures/a11y-runtime/${slug}/triggering.html`],
  clean: [`fixtures/a11y-runtime/${slug}/clean.html`],
})

export const runtimeRules: ReadonlyArray<Rule<RuntimeA11yContext>> = [
  axeRule({
    id: 'a11y/image-alt',
    axeRuleId: 'image-alt',
    title: 'Image has no text alternative',
    description:
      'An <img> element has no alt attribute, so a screen reader announces the file name or nothing at ' +
      'all. Decorative images need alt="" to be skipped; informative ones need text that conveys what ' +
      'the image conveys. Only a person can judge which this is, so the fix is never automatic.',
    severity: 'critical',
    docs: 'a11y-image-alt',
    standards: [WCAG.nonTextContent],
    fixtures: fixtures('image-alt'),
  }),
  axeRule({
    id: 'a11y/button-name',
    axeRuleId: 'button-name',
    title: 'Button has no accessible name',
    description:
      'A button exposes no name to assistive technology, so it is announced as "button" with no ' +
      'indication of what it does. Icon-only buttons are the usual cause.',
    severity: 'critical',
    docs: 'a11y-button-name',
    standards: [WCAG.nameRoleValue],
    fixtures: fixtures('button-name'),
  }),
  axeRule({
    id: 'a11y/link-name',
    axeRuleId: 'link-name',
    title: 'Link has no accessible name',
    description:
      'A link exposes no name, so it cannot be distinguished from any other link when a screen reader ' +
      'user lists the links on the page.',
    severity: 'serious',
    docs: 'a11y-link-name',
    standards: [WCAG.nameRoleValue, WCAG.linkPurpose],
    fixtures: fixtures('link-name'),
  }),
  axeRule({
    id: 'a11y/label',
    axeRuleId: 'label',
    title: 'Form field has no label',
    description:
      'A form control has no associated label, so its purpose is not announced and clicking the ' +
      'visible text does not focus it. A placeholder is not a label: it disappears on focus.',
    severity: 'critical',
    docs: 'a11y-label',
    standards: [WCAG.infoAndRelationships, WCAG.labelsOrInstructions, WCAG.nameRoleValue],
    fixtures: fixtures('label'),
  }),
  axeRule({
    id: 'a11y/select-name',
    axeRuleId: 'select-name',
    title: 'Select element has no accessible name',
    description:
      'A <select> has no associated label or accessible name, so its purpose is not announced.',
    severity: 'critical',
    docs: 'a11y-select-name',
    standards: [WCAG.nameRoleValue, WCAG.labelsOrInstructions],
    fixtures: fixtures('select-name'),
  }),
  axeRule({
    id: 'a11y/color-contrast',
    axeRuleId: 'color-contrast',
    title: 'Text contrast below the minimum ratio',
    description:
      'Text does not meet the 4.5:1 contrast ratio against its background (3:1 for large text). This ' +
      'is measured against the computed colours of the rendered page, which is why it only appears in ' +
      'a runtime scan.',
    severity: 'serious',
    docs: 'a11y-color-contrast',
    standards: [WCAG.contrastMinimum],
    fixtures: fixtures('color-contrast'),
  }),
  axeRule({
    id: 'a11y/html-has-lang',
    axeRuleId: 'html-has-lang',
    title: 'Page has no language attribute',
    description:
      'The <html> element has no lang attribute, so a screen reader reads the page with whatever voice ' +
      'and pronunciation rules it defaults to.',
    severity: 'serious',
    docs: 'a11y-html-has-lang',
    standards: [WCAG.languageOfPage],
    fixtures: fixtures('html-has-lang'),
  }),
  axeRule({
    id: 'a11y/document-title',
    axeRuleId: 'document-title',
    title: 'Page has no title',
    description:
      'The document has no non-empty <title>, so the tab, the browser history and the screen reader ' +
      'announcement all identify the page as untitled.',
    severity: 'serious',
    docs: 'a11y-document-title',
    standards: [WCAG.pageTitled],
    fixtures: fixtures('document-title'),
  }),
  axeRule({
    id: 'a11y/aria-required-attr',
    axeRuleId: 'aria-required-attr',
    title: 'ARIA role is missing a required attribute',
    description:
      'An element declares an ARIA role without the attributes that role requires, so assistive ' +
      'technology receives an incomplete or contradictory description of the widget.',
    severity: 'critical',
    docs: 'a11y-aria-required-attr',
    standards: [WCAG.nameRoleValue],
    fixtures: fixtures('aria-required-attr'),
  }),
  axeRule({
    id: 'a11y/aria-valid-attr-value',
    axeRuleId: 'aria-valid-attr-value',
    title: 'ARIA attribute has an invalid value',
    description:
      'An ARIA attribute holds a value the specification does not allow — most often an ' +
      'aria-labelledby or aria-describedby pointing at an id that is not on the page.',
    severity: 'critical',
    docs: 'a11y-aria-valid-attr-value',
    standards: [WCAG.nameRoleValue],
    fixtures: fixtures('aria-valid-attr-value'),
  }),
  axeRule({
    id: 'a11y/aria-hidden-focus',
    axeRuleId: 'aria-hidden-focus',
    title: 'Focusable element hidden from assistive technology',
    description:
      'An element with aria-hidden="true" contains something focusable. Keyboard users can reach it, ' +
      'screen reader users cannot hear it, and focus appears to vanish.',
    severity: 'serious',
    docs: 'a11y-aria-hidden-focus',
    standards: [WCAG.nameRoleValue, WCAG.focusOrder],
    fixtures: fixtures('aria-hidden-focus'),
  }),
  axeRule({
    id: 'a11y/frame-title',
    axeRuleId: 'frame-title',
    title: 'Frame has no title',
    description:
      'An <iframe> has no title attribute, so it is announced only as "frame" and a screen reader user ' +
      'cannot tell whether it is worth entering.',
    severity: 'serious',
    docs: 'a11y-frame-title',
    standards: [WCAG.nameRoleValue, WCAG.bypassBlocks],
    fixtures: fixtures('frame-title'),
  }),
  axeRule({
    id: 'a11y/list-structure',
    axeRuleId: 'list',
    title: 'List contains elements that are not list items',
    description:
      'A <ul> or <ol> has children other than <li>, which breaks the list semantics screen readers use ' +
      'to announce "list of 5 items" and to navigate between them.',
    severity: 'moderate',
    docs: 'a11y-list-structure',
    standards: [WCAG.infoAndRelationships],
    fixtures: fixtures('list-structure'),
  }),
  axeRule({
    id: 'a11y/heading-order',
    axeRuleId: 'heading-order',
    title: 'Heading levels skip a level',
    description:
      'Heading levels increase by more than one, so the document outline screen reader users navigate ' +
      'by has gaps in it. Note that no WCAG success criterion requires sequential heading levels — ' +
      'axe-core classifies this as a best practice and so do we.',
    severity: 'moderate',
    docs: 'a11y-heading-order',
    standards: [BEST_PRACTICE],
    fixtures: fixtures('heading-order'),
  }),
]
