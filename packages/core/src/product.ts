/**
 * The single source of truth for product identity and for every claim the
 * product is permitted to make about itself.
 *
 * Renaming the product is a one-file change: everything user-visible — CLI
 * output, docs generation, badges, the landing page, the API — imports from
 * here. Nothing else may hardcode the product name.
 *
 * The claim constants below are not marketing copy that happens to live in
 * code. They are a legal control. See DECISIONS.md ADR-0002 and
 * gtm/legal/disclaimers.md.
 */

/** Display name. Change this and the whole product renames. */
export const PRODUCT_NAME = 'Attest'

/** Lowercase identifier: CLI binary, config file prefix, docs URLs. */
export const PRODUCT_SLUG = 'attest'

/** npm scope the published packages live under. */
export const NPM_SCOPE = '@attestci'

/** Public site. Placeholder until the domain is bought — see PROGRESS.md. */
export const PRODUCT_URL = 'https://attest.ci'

/** Docs base URL. Every finding carries a link built from this. */
export const DOCS_URL = `${PRODUCT_URL}/docs`

/** Where rule documentation lives, one page per rule. */
export const RULE_DOCS_URL = `${DOCS_URL}/rules`

/**
 * The canonical positioning claim. This exact sentence is the outer boundary
 * of what the product is allowed to say about itself. Do not soften "does not
 * make you compliant" and do not add qualifiers that imply an exception.
 */
export const CANONICAL_CLAIM =
  `${PRODUCT_NAME} owns the automatable subset of accessibility conformance, ` +
  `proves it does not regress, and produces the evidence trail. ` +
  `It does not make you compliant, and no tool can.`

/**
 * Shown at the end of every report, in every export, and on every docs page.
 */
export const DISCLAIMER =
  `${PRODUCT_NAME} reports the results of automated checks. Automated testing ` +
  `detects only a subset of accessibility barriers. A clean ${PRODUCT_NAME} run ` +
  `is not a conformance claim, a legal opinion, or a substitute for testing ` +
  `with assistive technology and with disabled users. This is not legal advice.`

/**
 * The coverage limit, stated voluntarily and prominently rather than buried.
 *
 * The range is stated as a range on purpose: published estimates of automated
 * WCAG coverage vary by methodology and by the criteria set being counted, and
 * we have not run our own study. We therefore state a conservative range and
 * attribute it, rather than asserting a single number we cannot defend.
 * See docs/what-attest-cannot-detect.md for the full treatment.
 */
export const AUTOMATED_COVERAGE_NOTE =
  `Automated tooling can evaluate roughly a quarter to a third of WCAG 2.1 ` +
  `success criteria. The rest — meaningful alt text, logical reading order, ` +
  `usable focus management, comprehensible error recovery — requires human ` +
  `judgement. ${PRODUCT_NAME} does not attempt them and does not report on them.`

/**
 * Attribution. axe-core does the runtime accessibility detection and Deque
 * maintains it. Saying so is both correct and the reason the accessibility
 * community will give us the time of day.
 */
export const ATTRIBUTION =
  `Runtime accessibility detection is performed by axe-core, developed and ` +
  `maintained by Deque Systems, used under the Mozilla Public License 2.0. ` +
  `${PRODUCT_NAME} wraps axe-core; it does not fork or modify it.`

/**
 * Words and phrases that may never appear in user-facing surfaces as a claim
 * about what this product delivers. Enforced by scripts/check-forbidden-words.mjs.
 *
 * Each entry is a regex source string, matched case-insensitively.
 */
export const FORBIDDEN_CLAIM_PATTERNS: readonly string[] = [
  // "makes you compliant" / "compliance guaranteed" family
  String.raw`\bADA[- ]proof\b`,
  String.raw`\blawsuit[- ]proof\b`,
  String.raw`\bfully accessible\b`,
  String.raw`\bcertified\b`,
  String.raw`\bguarantee(?:d|s)?\s+(?:compliance|accessibility|conformance)\b`,
  String.raw`\b(?:we|it|this|attest)\s+(?:makes?|will make)\s+(?:you|your\s+\w+)\s+compliant\b`,
  String.raw`\b(?:become|becomes|get|gets)\s+compliant\b`,
  String.raw`\b100\s*%\s*(?:accessible|compliant|conformant|coverage|detection)\b`,
  String.raw`\bautomatically\s+compl(?:y|ies|iant)\b`,
  String.raw`\bWCAG[- ]compliant\b`,
  String.raw`\bcompliance\s+guaranteed\b`,
  String.raw`\bzero\s+(?:legal\s+)?risk\b`,
  String.raw`\bfull\s+WCAG\s+coverage\b`,
]

export type { }
