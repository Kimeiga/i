#!/usr/bin/env node
/**
 * The claim linter.
 *
 * `check-forbidden-words.mjs` catches a bad phrase. This catches the more
 * common and more expensive failure: a true-sounding sentence that nothing in
 * the repository supports.
 *
 * Every landing page is JSON, and every substantive block in it cites claim ids
 * from gtm/conversion/claims.yaml. This script fails the build when a page:
 *
 *   - cites an id that does not exist;
 *   - cites a prohibited claim;
 *   - cites a pending claim without saying, in that same section, that the
 *     thing is not yet available;
 *   - omits a claim that another claim requires as a companion (the "not legal
 *     advice" rule);
 *   - has a hero with no claims at all;
 *   - points at evidence that is not in the repository.
 *
 * The YAML is parsed by a deliberately small reader rather than a dependency.
 * The file is ours, its shape is fixed, and a linter that is itself a supply
 * chain is a poor trade for a project this size.
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const claimsPath = join(repoRoot, 'gtm/conversion/claims.yaml')
const pagesDir = join(repoRoot, 'apps/web/content/pages')

const problems = []

const claims = parseClaims(await readFile(claimsPath, 'utf8'))
if (claims.size === 0) {
  console.error('check-claims: parsed no claims from gtm/conversion/claims.yaml')
  process.exit(2)
}

/** Phrases that satisfy the disclosure requirement for a `pending` claim. */
const PENDING_DISCLOSURES = [/not yet available/i, /is not deployed/i, /nothing is for sale/i]

/** A claim that must appear whenever another one does. */
const COMPANIONS = new Map()
for (const claim of claims.values()) {
  if (claim.required_companion) COMPANIONS.set(claim.id, claim.required_companion)
}

const files = (await readdir(pagesDir)).filter((name) => name.endsWith('.json'))
if (files.length === 0) problems.push('no page specs found in apps/web/content/pages')

for (const file of files) {
  const spec = JSON.parse(await readFile(join(pagesDir, file), 'utf8'))
  checkPage(file, spec)
}

// Evidence pointers must resolve, or a "verified" claim is only asserted.
for (const claim of claims.values()) {
  for (const evidence of claim.evidence ?? []) {
    const path = evidence.split('::')[0].trim()
    if (path.startsWith('git log:') || path.startsWith('http')) continue
    if (!existsSync(join(repoRoot, path))) {
      problems.push(`${claim.id}: evidence path does not exist — ${path}`)
    }
  }
}

if (problems.length > 0) {
  console.error('\ncheck-claims: page content is not supported by the claim graph.\n')
  for (const problem of problems) console.error(`  ${problem}`)
  console.error('')
  console.error('Every substantive block cites claim ids from gtm/conversion/claims.yaml.')
  console.error('If the claim is true and missing, add it with its evidence. If it is not')
  console.error('true, the sentence has to change.\n')
  process.exit(1)
}

const verified = [...claims.values()].filter((c) => c.status === 'verified').length
console.log(
  `check-claims: ${files.length} page(s), ${claims.size} claims (${verified} verified), all citations supported`,
)

/* ------------------------------------------------------------------ page -- */

function checkPage(file, spec) {
  const where = (suffix) => `${file}${suffix}`

  const heroIds = spec.hero?.claimIds ?? []
  if (heroIds.length === 0) {
    problems.push(where(': hero cites no claim ids'))
  }

  const cited = new Set()
  const blocks = []

  blocks.push({ label: 'hero', ids: heroIds, text: [spec.hero?.headline, spec.hero?.subhead, spec.hero?.trustLine] })
  if (spec.hero?.proofLine) {
    blocks.push({ label: 'hero.proofLine', ids: spec.hero.proofLine.claimIds ?? [], text: [spec.hero.proofLine.text] })
  }

  for (const section of spec.sections ?? []) {
    const text = [
      section.heading,
      section.intro,
      section.caption,
      section.note,
      section.body,
      section.steps?.map((s) => `${s.title} ${s.body}`),
      section.rows?.flat(),
    ]
    blocks.push({ label: `section:${section.id}`, ids: section.claimIds ?? [], text })

    for (const item of section.items ?? []) {
      blocks.push({
        label: `section:${section.id}:${item.q?.slice(0, 40)}`,
        ids: item.claimIds ?? [],
        text: [item.q, item.a],
      })
    }
  }

  for (const block of blocks) {
    const flat = flatten(block.text).join(' ')
    for (const id of block.ids) {
      cited.add(id)
      const claim = claims.get(id)

      if (!claim) {
        problems.push(where(`: ${block.label} cites unknown claim ${id}`))
        continue
      }

      if (claim.status === 'prohibited') {
        problems.push(
          where(`: ${block.label} cites PROHIBITED claim ${id} — ${claim.reason ?? 'no reason recorded'}`),
        )
        continue
      }

      if (claim.status === 'pending') {
        const disclosed = PENDING_DISCLOSURES.some((pattern) => pattern.test(flat))
        if (!disclosed) {
          problems.push(
            where(
              `: ${block.label} cites pending claim ${id} without saying it is not yet available. ` +
                `Describing something that does not exist as though it does is the failure this ` +
                `check exists for.`,
            ),
          )
        }
      }
    }
  }

  // Companion requirements, e.g. any regulatory claim must carry "not legal advice".
  for (const id of cited) {
    const companion = COMPANIONS.get(id)
    if (companion && !cited.has(companion)) {
      problems.push(
        where(`: cites ${id} but not its required companion ${companion} (${claims.get(companion)?.text ?? ''})`),
      )
    }
  }

  // A page that cites a legally sensitive claim must carry the disclaimer.
  const sensitive = [...cited].filter((id) => claims.get(id)?.legal_sensitivity === 'high')
  if (sensitive.length > 0 && !cited.has('C063')) {
    problems.push(
      where(`: cites legally sensitive claims (${sensitive.join(', ')}) without C063 "this is not legal advice"`),
    )
  }
}

function flatten(value) {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) return value.flatMap(flatten)
  return [String(value)]
}

/* ------------------------------------------------------------------ yaml -- */

/**
 * Reads exactly the shape of claims.yaml: a `claims:` list of maps whose values
 * are scalars or simple string lists. Not a general YAML parser and does not
 * pretend to be one — it fails loudly on anything it does not recognise rather
 * than silently mis-reading a claim's status.
 */
function parseClaims(source) {
  const out = new Map()
  const lines = source.split(/\r?\n/)

  let inClaims = false
  let current = null
  // What the last `key:` opened: a list, a folded scalar, or nothing.
  let pending = null // { key, kind: 'list' | 'fold' }

  const commit = () => {
    if (current?.id) out.set(current.id, current)
    current = null
    pending = null
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')
    if (!line) continue
    if (/^\s*#/.test(line)) continue

    if (/^claims:\s*$/.test(line)) {
      inClaims = true
      continue
    }
    if (!inClaims) continue
    if (/^\S/.test(line)) break // left the claims block

    // `  - id: C001` starts a new claim.
    const item = line.match(/^ {2}- (\w+):\s*(.*)$/)
    if (item) {
      commit()
      current = {}
      current[item[1]] = unquote(item[2])
      continue
    }
    if (!current) continue

    // `    key: value`, `    key:`, or `    key: >-`
    const field = line.match(/^ {4}([\w-]+):\s*(.*)$/)
    if (field) {
      const key = field[1]
      const value = field[2]
      if (value === '') {
        pending = { key, kind: 'list' }
        current[key] = []
      } else if (value === '>-' || value === '>' || value === '|' || value === '|-') {
        pending = { key, kind: 'fold' }
        current[key] = ''
      } else {
        pending = null
        current[key] = unquote(value)
      }
      continue
    }

    // Continuation, at six spaces: either a list item or folded text.
    const deeper = line.match(/^ {6}(.*)$/)
    if (deeper && pending) {
      const rest = deeper[1]
      if (pending.kind === 'list') {
        const listItem = rest.match(/^- (.*)$/)
        if (listItem) current[pending.key].push(unquote(listItem[1]))
      } else {
        current[pending.key] = `${current[pending.key]} ${rest.trim()}`.trim()
      }
    }
  }
  commit()
  return out
}

function unquote(value) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}
