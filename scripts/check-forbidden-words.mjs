#!/usr/bin/env node
/**
 * Fails the build when a user-facing surface makes a claim the product is not
 * allowed to make.
 *
 * This is a legal control implemented as a test. A solo founder with no lawyer
 * cannot afford to discover in a deposition that a landing page said
 * "WCAG-compliant" because it read better. The list of patterns lives in
 * packages/core/src/product.ts so the code, the docs and the marketing copy are
 * all constrained by the same source.
 *
 * Two kinds of line legitimately contain a banned phrase: a quotation of someone
 * else's claim (the FTC's accessiBe complaint, an overlay vendor's own words),
 * and an explicit denial of one ("we are not SOC 2 certified"). Mark those with
 * `claims-ok:` and a reason, on the line itself or the one above it.
 *
 * The check does not try to detect negation itself. A regex that understands
 * "not" well enough to be trusted here does not exist, and a control that
 * silently permits a class of sentence is not a control — an explicit marker
 * with a written reason is.
 */

import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

const distProduct = join(repoRoot, 'packages/core/dist/product.js')
if (!existsSync(distProduct)) {
  console.error('check-forbidden-words: build the packages first (`pnpm build`).')
  process.exit(2)
}
const { FORBIDDEN_CLAIM_PATTERNS, PRODUCT_NAME } = await import(distProduct)

/** Surfaces a reader could mistake for a promise. */
const SCANNED_ROOTS = ['docs', 'gtm', 'apps/web', 'packages/action/README.md', 'README.md']

const SCANNED_EXTENSIONS = ['.md', '.mdx', '.html', '.tsx', '.ts', '.jsx', '.js', '.json', '.txt', '.yml', '.yaml']

const ALLOW_MARKER = /claims-ok:/

const patterns = FORBIDDEN_CLAIM_PATTERNS.map((source) => ({
  source,
  regex: new RegExp(source, 'i'),
}))

const problems = []

for (const root of SCANNED_ROOTS) {
  const absolute = join(repoRoot, root)
  if (!existsSync(absolute)) continue
  for (const file of await collect(absolute)) await checkFile(file)
}

if (problems.length > 0) {
  console.error(`\n${PRODUCT_NAME}: forbidden claim(s) found in user-facing text.\n`)
  for (const problem of problems) {
    console.error(`  ${problem.file}:${problem.line}`)
    console.error(`    matched /${problem.pattern}/`)
    console.error(`    ${problem.text.trim()}`)
    console.error('')
  }
  console.error('These phrases assert a compliance outcome the product does not deliver.')
  console.error('Rewrite the sentence. If you are quoting someone else, or explicitly')
  console.error('denying the claim, add a `claims-ok: <reason>` comment on that line or')
  console.error('the line above it.\n')
  process.exit(1)
}

console.log(`check-forbidden-words: no forbidden claims in ${SCANNED_ROOTS.join(', ')}`)

async function collect(path) {
  const stats = await readdir(path, { withFileTypes: true }).catch(() => undefined)
  if (!stats) return SCANNED_EXTENSIONS.some((ext) => path.endsWith(ext)) ? [path] : []

  const files = []
  for (const entry of stats) {
    const child = join(path, entry.name)
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'dist', 'build'].includes(entry.name)) continue
      files.push(...(await collect(child)))
    } else if (SCANNED_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      files.push(child)
    }
  }
  return files
}

async function checkFile(file) {
  const text = await readFile(file, 'utf8')
  const lines = text.split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (ALLOW_MARKER.test(line)) continue
    if (i > 0 && ALLOW_MARKER.test(lines[i - 1])) continue

    for (const { source, regex } of patterns) {
      if (regex.test(line)) {
        problems.push({
          file: relative(repoRoot, file),
          line: i + 1,
          pattern: source,
          text: line,
        })
      }
    }
  }
}
