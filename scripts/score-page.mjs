#!/usr/bin/env node
/**
 * The offline page rubric.
 *
 * **This is a rejection filter, not a conversion predictor.** Nothing here has
 * been validated against a single real visitor, and a page that scores 95 is
 * not more likely to convert than one that scores 80 — it is only less likely
 * to be obviously broken. Treating the number as a target is the exact mistake
 * that "optimise for sounding human" makes, one level up.
 *
 * Its actual job is to catch the failures that are cheap to detect and
 * embarrassing to ship: a page with no limitation section, a hero that cites no
 * evidence, a CTA nobody can measure, a wall of buzzwords.
 *
 * Weights follow gtm/conversion/scoring-rubric.md. Hard failures override the
 * score entirely, because a page that conceals a material limitation is not a
 * 71 — it is not shippable.
 */

import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const pagesDir = join(repoRoot, 'apps/web/content/pages')

/** Words that carry no information about what a product does. */
const BUZZWORDS = [
  'seamless', 'seamlessly', 'powerful', 'robust', 'cutting-edge', 'best-in-class',
  'revolutionary', 'revolutionize', 'game-changing', 'next-generation', 'world-class',
  'effortless', 'effortlessly', 'unlock', 'supercharge', 'empower', 'leverage',
  'holistic', 'synergy', 'streamline', 'transform your', 'peace of mind',
  'seamless integration', 'ai-powered', 'intelligent automation', 'take it to the next level',
]

/** Concrete markers: file paths, commands, identifiers, numbers with units. */
const CONCRETE = [
  /`[^`]+`/, // inline code
  /\b[\w-]+\.(tsx?|jsx?|json|yml|yaml|md)\b/, // filenames
  /\bnpx |\bnpm i\b/, // commands
  /\b\d+ (KB|MB|ms|rules|findings|repositories|pages)\b/,
  /\bWCAG 2\.1\b/,
]

const args = process.argv.slice(2)
const threshold = Number(args.find((a) => a.startsWith('--min='))?.split('=')[1] ?? 70)

const files = (await readdir(pagesDir)).filter((f) => f.endsWith('.json'))
let worst = 100
let anyHardFailure = false

for (const file of files) {
  const spec = JSON.parse(await readFile(join(pagesDir, file), 'utf8'))
  const result = score(spec)
  worst = Math.min(worst, result.total)
  if (result.hardFailures.length > 0) anyHardFailure = true

  console.log(`\n${file} — ${spec.id} (${spec.hypothesisId})`)
  console.log(`  score ${result.total}/100`)
  for (const [dimension, detail] of Object.entries(result.dimensions)) {
    const bar = detail.earned === detail.weight ? ' ' : '!'
    console.log(`  ${bar} ${dimension.padEnd(28)} ${detail.earned}/${detail.weight}  ${detail.why}`)
  }
  for (const failure of result.hardFailures) {
    console.log(`  HARD FAILURE: ${failure}`)
  }
}

console.log('')
if (anyHardFailure) {
  console.error('score-page: a page has a hard failure and is not shippable.')
  process.exit(1)
}
if (worst < threshold) {
  console.error(`score-page: lowest page scored ${worst}, below the ${threshold} floor.`)
  process.exit(1)
}
console.log(`score-page: ${files.length} page(s), lowest ${worst}/100, no hard failures`)
console.log('Reminder: this is a rejection filter. It predicts nothing about conversion.')

/* -------------------------------------------------------------------------- */

function score(spec) {
  const dimensions = {}
  const hardFailures = []
  const text = allText(spec)
  const words = text.split(/\s+/).length
  const kinds = new Set(spec.sections.map((s) => s.kind))
  const ids = new Set(spec.sections.map((s) => s.id))

  const give = (name, weight, earned, why) => {
    dimensions[name] = { weight, earned: Math.max(0, Math.min(weight, earned)), why }
  }

  // ---------------------------------------------------------- message match --
  const hasTraffic = Array.isArray(spec.trafficSources) && spec.trafficSources.length > 0
  const hasEyebrow = Boolean(spec.hero?.eyebrow)
  give(
    'traffic + buyer match',
    15,
    (hasTraffic ? 10 : 0) + (hasEyebrow ? 5 : 0),
    hasTraffic ? `written for ${spec.trafficSources.join(', ')}` : 'no traffic source declared',
  )
  if (!hasTraffic) hardFailures.push('names no traffic source; a page for everyone is a page for nobody')

  // ------------------------------------------------------ concrete outcome ---
  const heroText = `${spec.hero.headline} ${spec.hero.subhead}`
  const concreteHits = CONCRETE.filter((re) => re.test(heroText)).length
  give(
    'concrete problem/outcome',
    10,
    Math.min(10, concreteHits * 5),
    `${concreteHits} concrete marker(s) above the fold`,
  )

  // ---------------------------------------------------- mechanism clarity ----
  const hasMechanism = kinds.has('evidence') || kinds.has('steps') || kinds.has('code')
  give('mechanism clarity', 10, hasMechanism ? 10 : 0, hasMechanism ? 'shows how it works' : 'no mechanism section')
  if (!hasMechanism) hardFailures.push('no section explains how the product actually works')

  // ---------------------------------------------------- product specificity --
  const filePaths = (text.match(/\b[\w/.-]+\.(tsx?|jsx?|json|yml)\b/g) ?? []).length
  give('product specificity', 10, Math.min(10, filePaths), `${filePaths} real path(s) named`)

  // ------------------------------------------------------ evidence + proof ---
  const claimCount = countClaims(spec)
  const hasSourceLink = spec.sections.some((s) => s.kind === 'evidence' && s.source)
  give(
    'evidence and proof',
    15,
    Math.min(12, claimCount) + (hasSourceLink ? 3 : 0),
    `${claimCount} claim citation(s)${hasSourceLink ? ', evidence links to a report' : ''}`,
  )
  if (claimCount === 0) hardFailures.push('cites no claims at all')

  // -------------------------------------------------------- differentiation --
  const differentiates = /ESLint|axe|linter|one file at a time|whole import graph/i.test(text)
  give(
    'differentiation',
    10,
    differentiates ? 10 : 0,
    differentiates ? 'says what else cannot do' : 'never distinguishes itself from the alternative',
  )

  // ------------------------------------------------ credibility and limits ---
  const hasLimits = spec.sections.some(
    (s) => s.id === 'limits' || s.kind === 'disclosure' || /cannot|does not/i.test(s.heading ?? ''),
  )
  const admitsError = ids.has('what-we-got-wrong')
  give(
    'credibility and limits',
    10,
    (hasLimits ? 6 : 0) + (admitsError ? 4 : 0),
    `${hasLimits ? 'limits stated' : 'NO LIMITS SECTION'}${admitsError ? ', own errors published' : ''}`,
  )
  if (!hasLimits) {
    hardFailures.push('no section states what the product cannot do')
  }

  // ------------------------------------------------------ CTA congruence -----
  const primary = spec.primaryCta
  const ctaMeasurable = Boolean(primary?.event)
  const ctaActionable = Boolean(primary?.command || primary?.href)
  const repeated = spec.sections.some((s) => s.kind === 'cta')
  give(
    'CTA and offer congruence',
    10,
    (ctaMeasurable ? 4 : 0) + (ctaActionable ? 3 : 0) + (repeated ? 3 : 0),
    `${ctaMeasurable ? 'measurable' : 'NOT MEASURABLE'}, ${ctaActionable ? 'actionable' : 'no action'}${repeated ? ', repeated at the end' : ''}`,
  )
  if (!ctaMeasurable) hardFailures.push('primary CTA has no event name, so no experiment can read it')

  // ----------------------------------------------------------- scannability --
  const headings = spec.sections.length
  const descriptive = spec.sections.filter((s) => (s.heading ?? '').split(/\s+/).length >= 3).length
  give(
    'scannability',
    5,
    Math.min(5, Math.round((descriptive / Math.max(1, headings)) * 5)),
    `${descriptive}/${headings} headings are descriptive`,
  )

  // ------------------------------------------------------------- voice -------
  // A buzzword inside a sentence that attributes it to somebody else is a
  // quotation, not a claim — the pages characterise accessiBe's marketing and
  // the FTC's findings, and both require the vendor's own words. Same reasoning
  // as the `claims-ok` marker in check-forbidden-words.mjs.
  const buzz = BUZZWORDS.filter((word) => usedAsOwnClaim(text, word))
  const density = (buzz.length / Math.max(1, words)) * 1000
  give(
    'audience-native voice',
    5,
    buzz.length === 0 ? 5 : Math.max(0, 5 - buzz.length),
    buzz.length === 0 ? 'no buzzwords' : `buzzwords: ${buzz.join(', ')}`,
  )
  if (density > 2) hardFailures.push(`buzzword density ${density.toFixed(1)}/1000 words`)

  const total = Object.values(dimensions).reduce((sum, d) => sum + d.earned, 0)
  return { total, dimensions, hardFailures }
}

/** True when the buzzword appears outside any attributed sentence. */
function usedAsOwnClaim(text, word) {
  const pattern = new RegExp(`\\b${word}\\b`, 'i')
  const attribution = /accessiBe|Federal Trade Commission|FTC|alleged|claimed that|claims that/i
  return text
    .split(/(?<=[.!?])\s+/)
    .some((sentence) => pattern.test(sentence) && !attribution.test(sentence))
}

function allText(spec) {
  const parts = [spec.hero.eyebrow, spec.hero.headline, spec.hero.subhead, spec.hero.trustLine]
  if (spec.hero.proofLine) parts.push(spec.hero.proofLine.text)
  for (const section of spec.sections) {
    parts.push(section.heading, section.intro, section.caption, section.note, section.code)
    if (section.body) parts.push(...section.body)
    if (section.steps) for (const step of section.steps) parts.push(step.title, step.body)
    if (section.rows) parts.push(...section.rows.flat())
    if (section.items) for (const item of section.items) parts.push(item.q, ...item.a)
  }
  return parts.filter(Boolean).join(' ')
}

function countClaims(spec) {
  const ids = new Set(spec.hero.claimIds ?? [])
  for (const id of spec.hero.proofLine?.claimIds ?? []) ids.add(id)
  for (const section of spec.sections) {
    for (const id of section.claimIds ?? []) ids.add(id)
    for (const item of section.items ?? []) for (const id of item.claimIds ?? []) ids.add(id)
  }
  return ids.size
}
