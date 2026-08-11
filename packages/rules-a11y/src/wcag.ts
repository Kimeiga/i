import type { StandardRef } from '@attestci/core'

/**
 * WCAG 2.1 success criteria referenced by this pack.
 *
 * Each entry links to the W3C Understanding document rather than to a page we
 * wrote, because the primary source is the thing a reader needs when they
 * disagree with a finding.
 *
 * WCAG 2.1 rather than 2.2 is deliberate and current: EN 301 549 v3.2.1 is the
 * harmonised standard referenced for the European Accessibility Act and it
 * incorporates WCAG 2.1 Level AA. A v4.x of EN 301 549 incorporating WCAG 2.2
 * has been drafted and is expected to be referenced in the Official Journal;
 * until that reference lands, 2.1 is the legal yardstick. See
 * docs/regulatory-context.md, which records what was verified and when.
 */
function sc(id: string, title: string, level: 'A' | 'AA'): StandardRef {
  return {
    framework: 'wcag21',
    id,
    level,
    title,
    url: `https://www.w3.org/WAI/WCAG21/Understanding/${slugFor(id, title)}.html`,
  }
}

function slugFor(_id: string, title: string): string {
  return title
    .toLowerCase()
    .replace(/[(),]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const WCAG = {
  nonTextContent: sc('1.1.1', 'Non-text Content', 'A'),
  infoAndRelationships: sc('1.3.1', 'Info and Relationships', 'A'),
  contrastMinimum: sc('1.4.3', 'Contrast (Minimum)', 'AA'),
  keyboard: sc('2.1.1', 'Keyboard', 'A'),
  bypassBlocks: sc('2.4.1', 'Bypass Blocks', 'A'),
  pageTitled: sc('2.4.2', 'Page Titled', 'A'),
  focusOrder: sc('2.4.3', 'Focus Order', 'A'),
  linkPurpose: sc('2.4.4', 'Link Purpose (In Context)', 'A'),
  languageOfPage: sc('3.1.1', 'Language of Page', 'A'),
  errorIdentification: sc('3.3.1', 'Error Identification', 'A'),
  labelsOrInstructions: sc('3.3.2', 'Labels or Instructions', 'A'),
  nameRoleValue: sc('4.1.2', 'Name, Role, Value', 'A'),
} as const satisfies Record<string, StandardRef>

/**
 * The EN 301 549 clause that carries WCAG into European law. Clause 9 is the
 * web chapter; its sub-clauses are numbered `9.<wcag criterion>`.
 */
export function en301549(criterion: StandardRef): StandardRef {
  return {
    framework: 'en301549',
    id: `9.${criterion.id}`,
    level: criterion.level,
    title: criterion.title,
    url: 'https://www.etsi.org/deliver/etsi_en/301500_301599/301549/',
  }
}

/**
 * Some axe rules are good engineering advice that no success criterion
 * requires. Labelling them honestly matters more here than anywhere: a tool
 * that reports best practices as WCAG failures inflates its own numbers and
 * teaches users that WCAG references cannot be trusted.
 */
export const BEST_PRACTICE: StandardRef = {
  framework: 'privacy-property',
  id: 'axe-best-practice',
  title: 'axe-core best practice, not required by any WCAG success criterion',
  url: 'https://dequeuniversity.com/rules/axe/4.13',
}
