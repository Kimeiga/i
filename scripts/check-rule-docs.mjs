#!/usr/bin/env node
/**
 * Every registered rule must have a docs page and fixtures on disk.
 *
 * This is the mechanism that makes "a rule ships in one session" mean a
 * *complete* rule. Writing the detection is the fun part and takes forty
 * minutes; the docs page and the clean fixture are what make it usable by
 * someone who did not write it, and they are what gets skipped when nobody is
 * checking.
 */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const cliDist = join(repoRoot, 'packages/cli/dist/index.js')

if (!existsSync(cliDist)) {
  console.error('check-rule-docs: build the packages first (`pnpm build`).')
  process.exit(2)
}

const { allRules } = await import(cliDist)
const problems = []

for (const rule of allRules) {
  const docsPath = join(repoRoot, 'docs/rules', `${rule.docs}.md`)

  if (!existsSync(docsPath)) {
    problems.push(`${rule.id}: no docs page at docs/rules/${rule.docs}.md`)
  } else {
    const page = await readFile(docsPath, 'utf8')
    if (!page.includes(rule.id)) {
      problems.push(`${rule.id}: docs/rules/${rule.docs}.md never names the rule id`)
    }
    // The four things someone reading a finding needs. A docs page missing any
    // of them sends them to the source.
    for (const heading of ['## What it detects', '## Why it matters', '## How to fix it', '## How to suppress it']) {
      if (!page.includes(heading)) {
        problems.push(`${rule.id}: docs/rules/${rule.docs}.md is missing the "${heading}" section`)
      }
    }
  }

  for (const fixture of [...rule.fixtures.triggering, ...rule.fixtures.clean]) {
    if (!existsSync(join(repoRoot, fixture))) {
      problems.push(`${rule.id}: fixture ${fixture} does not exist`)
    }
  }
  if (rule.fixtures.clean.length === 0) {
    problems.push(`${rule.id}: has no clean fixture, so nothing guards against false positives`)
  }
}

// The rules index must list every rule, or it silently rots.
const indexPath = join(repoRoot, 'docs/rules/index.md')
if (!existsSync(indexPath)) {
  problems.push('docs/rules/index.md does not exist')
} else {
  const index = await readFile(indexPath, 'utf8')
  for (const rule of allRules) {
    if (!index.includes(rule.id)) problems.push(`docs/rules/index.md does not list ${rule.id}`)
  }
}

if (problems.length > 0) {
  console.error('\ncheck-rule-docs: incomplete rules\n')
  for (const problem of problems) console.error(`  ${problem}`)
  console.error('')
  process.exit(1)
}

console.log(`check-rule-docs: ${allRules.length} rules, all documented with fixtures`)
