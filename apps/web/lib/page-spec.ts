/**
 * Landing pages are data, not components.
 *
 * Three reasons this is worth the indirection:
 *
 *  - Every substantive sentence carries the claim ids it rests on, so
 *    `scripts/check-claims.mjs` can fail the build on a claim that is
 *    unsupported, prohibited, or describes something not yet built. A page
 *    written as JSX can only be checked by reading it.
 *  - A model asked to improve the page edits content, not arbitrary DOM, so the
 *    component system does not silently rot into forty bespoke variants.
 *  - Sections can be reordered and swapped by experiment id without touching a
 *    renderer, which is the difference between testing a positioning and
 *    testing a paragraph.
 */

export type ClaimId = string

export interface Cta {
  label: string
  href?: string
  /** Rendered as a copyable command rather than a link. */
  command?: string
  /** Event name recorded when it is used. See lib/events.ts. */
  event: string
}

export interface Hero {
  eyebrow: string
  headline: string
  subhead: string
  /**
   * One short, checkable statement placed immediately under the subhead. Not a
   * testimonial — there are none — but a fact a sceptical reader can verify.
   */
  proofLine?: { text: string; href?: string; claimIds: ClaimId[] }
  trustLine: string
  claimIds: ClaimId[]
}

export type Section =
  | {
      kind: 'prose'
      id: string
      heading: string
      body: string[]
      claimIds?: ClaimId[]
    }
  | {
      kind: 'evidence'
      id: string
      heading: string
      intro?: string
      /** Rendered as a labelled chain, e.g. an import path or a failure trace. */
      chain: { label: string; note?: string }[]
      caption?: string
      source?: { label: string; href: string }
      claimIds: ClaimId[]
    }
  | {
      kind: 'code'
      id: string
      heading: string
      intro?: string
      language: string
      code: string
      caption?: string
      claimIds?: ClaimId[]
    }
  | {
      kind: 'steps'
      id: string
      heading: string
      intro?: string
      steps: { title: string; body: string }[]
      claimIds?: ClaimId[]
    }
  | {
      kind: 'table'
      id: string
      heading: string
      intro?: string
      columns: string[]
      rows: string[][]
      note?: string
      claimIds?: ClaimId[]
    }
  | {
      kind: 'disclosure'
      id: string
      heading: string
      body: string[]
      tone: 'limit' | 'admission'
      claimIds?: ClaimId[]
    }
  | {
      kind: 'faq'
      id: string
      heading: string
      items: { q: string; a: string[]; claimIds?: ClaimId[] }[]
    }
  | {
      kind: 'cta'
      id: string
      heading: string
      body?: string
      primary: Cta
      secondary?: Cta
    }

export interface PageSpec {
  id: string
  /** Which brief in gtm/conversion/positioning-hypotheses.md this is built from. */
  hypothesisId: 'H1' | 'H2' | 'H3' | 'H4' | 'H5'
  /** Traffic this page is written for. Message match is not optional. */
  trafficSources: string[]
  objective: {
    primaryMetric: string
    offer: string
  }
  hero: Hero
  sections: Section[]
  primaryCta: Cta
  secondaryCta?: Cta
  /** Assigned when this page is part of a live experiment. */
  experimentId?: string
}

/**
 * Validates a spec at build time. Deliberately strict about the things that
 * would let an unchecked claim through, and silent about everything else.
 */
export function assertPageSpec(value: unknown, source: string): PageSpec {
  const spec = value as PageSpec
  const fail = (message: string): never => {
    throw new Error(`${source}: ${message}`)
  }

  if (!spec || typeof spec !== 'object') fail('is not an object')
  if (!spec.id) fail('has no id')
  if (!spec.hypothesisId) fail('has no hypothesisId — every page is built from a brief')
  if (!Array.isArray(spec.trafficSources) || spec.trafficSources.length === 0) {
    fail('names no traffic source; a page written for everyone is written for nobody')
  }
  if (!spec.hero?.headline) fail('has no headline')
  if (!spec.hero?.trustLine) fail('has no trust line')
  if (!Array.isArray(spec.hero?.claimIds) || spec.hero.claimIds.length === 0) {
    fail('hero cites no claim ids')
  }
  if (!spec.primaryCta?.event) fail('primary CTA has no event name, so it cannot be measured')
  if (!Array.isArray(spec.sections) || spec.sections.length === 0) fail('has no sections')

  const ids = new Set<string>()
  for (const section of spec.sections) {
    if (!section.id) fail(`section of kind "${section.kind}" has no id`)
    if (ids.has(section.id)) fail(`duplicate section id "${section.id}"`)
    ids.add(section.id)
  }

  return spec
}

/** Every claim id a page depends on, in citation order. */
export function claimIdsOf(spec: PageSpec): string[] {
  const out = new Set<string>(spec.hero.claimIds)
  for (const id of spec.hero.proofLine?.claimIds ?? []) out.add(id)
  for (const section of spec.sections) {
    if ('claimIds' in section) for (const id of section.claimIds ?? []) out.add(id)
    if (section.kind === 'faq') {
      for (const item of section.items) for (const id of item.claimIds ?? []) out.add(id)
    }
  }
  return [...out]
}
