#!/usr/bin/env node
/**
 * Generates one documentation page per rule from the rule's own metadata and
 * its real fixture files.
 *
 * Generated rather than hand-written because the alternative is drift: the
 * fixture changes, the docs page keeps showing last month's example, and a
 * reader who copies it gets a finding the page says they should not. CI runs
 * this with --check, so a rule whose docs are stale fails the build.
 *
 * Judgement that metadata cannot express — why a boundary matters, what the
 * regulation says, when to ignore the rule — lives in `docs/rules/notes/<slug>.md`
 * and is spliced in. A rule with no notes file still gets an accurate page.
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const outDir = join(repoRoot, 'docs/rules')
const notesDir = join(outDir, 'notes')
const check = process.argv.includes('--check')

const { allRules } = await import(join(repoRoot, 'packages/cli/dist/index.js'))
const { AUTOMATED_COVERAGE_NOTE, DISCLAIMER, PRODUCT_NAME } = await import(
  join(repoRoot, 'packages/core/dist/product.js')
)

await mkdir(outDir, { recursive: true })
await mkdir(notesDir, { recursive: true })

const stale = []

for (const rule of allRules) {
  const page = await renderRulePage(rule)
  await emit(join(outDir, `${rule.docs}.md`), page)
}

await emit(join(outDir, 'index.md'), await renderIndex())

if (check && stale.length > 0) {
  console.error('\ngenerate-rule-docs: these pages are out of date. Run `pnpm docs:rules`.\n')
  for (const path of stale) console.error(`  ${path}`)
  console.error('')
  process.exit(1)
}

console.log(
  check
    ? `generate-rule-docs: ${allRules.length} rule pages are up to date`
    : `generate-rule-docs: wrote ${allRules.length} rule pages`,
)

async function emit(path, content) {
  const existing = existsSync(path) ? await readFile(path, 'utf8') : undefined
  if (existing === content) return
  if (check) {
    stale.push(path.replace(`${repoRoot}`, ''))
    return
  }
  await writeFile(path, content, 'utf8')
}

async function renderRulePage(rule) {
  const notes = await readNotes(rule.docs)
  const out = []

  out.push(`# \`${rule.id}\``)
  out.push('')
  out.push(`> ${rule.title}`)
  out.push('')
  out.push('| | |')
  out.push('| --- | --- |')
  out.push(`| Severity | ${rule.severity} |`)
  out.push(`| Layer | ${layerLabel(rule.kind)} |`)
  out.push(`| Status | ${rule.experimental ? '**experimental** — off unless enabled in config' : 'enabled by default'} |`)
  out.push('')

  out.push('## What it detects')
  out.push('')
  out.push(rule.description)
  out.push('')

  out.push('## Why it matters')
  out.push('')
  out.push(notes.why ?? defaultWhy(rule))
  out.push('')

  out.push('## Standards')
  out.push('')
  out.push('| Framework | Reference | |')
  out.push('| --- | --- | --- |')
  for (const standard of rule.standards) {
    const level = standard.level ? ` (Level ${standard.level})` : ''
    const link = standard.url ? `[${standard.title}](${standard.url})` : standard.title
    out.push(`| ${frameworkLabel(standard.framework)} | ${standard.id}${level} | ${link} |`)
  }
  out.push('')
  if (rule.standards.every((s) => s.framework === 'privacy-property')) {
    out.push(
      '`privacy-property` means this is our own definition, not a numbered requirement in a published ' +
        'standard. We label it that way rather than citing a regulation that does not say it.',
    )
    out.push('')
  }

  out.push('## Code that triggers it')
  out.push('')
  for (const fixture of rule.fixtures.triggering) out.push(await embed(fixture))
  out.push('')

  out.push('## Code that does not')
  out.push('')
  for (const fixture of rule.fixtures.clean) out.push(await embed(fixture))
  out.push('')

  out.push('## How to fix it')
  out.push('')
  out.push(notes.fix ?? defaultFix(rule))
  out.push('')

  if (notes.limits) {
    out.push('## What this rule will not catch')
    out.push('')
    out.push(notes.limits)
    out.push('')
  }

  out.push('## How to suppress it')
  out.push('')
  out.push('```ts')
  out.push(`// attest-disable-next-line ${rule.id} -- why this instance is intentional`)
  out.push('```')
  out.push('')
  out.push('Or for a whole file:')
  out.push('')
  out.push('```ts')
  out.push(`// attest-disable-file ${rule.id} -- why this file is intentional`)
  out.push('```')
  out.push('')
  out.push('Or in `attest.config.json`, to turn the rule off everywhere:')
  out.push('')
  out.push('```json')
  out.push(JSON.stringify({ rules: { [rule.id]: 'off' } }, null, 2))
  out.push('```')
  out.push('')
  out.push(
    'Suppressed findings are **recorded in the report**, with the reason you gave. That is deliberate: ' +
      'a suppression is a decision, and the evidence trail keeps decisions. It is not a way to make a ' +
      'finding disappear from the record.',
  )
  out.push('')

  out.push('---')
  out.push('')
  out.push(`_${AUTOMATED_COVERAGE_NOTE}_`)
  out.push('')
  out.push(`_${DISCLAIMER}_`)
  out.push('')
  out.push('<!-- Generated by scripts/generate-rule-docs.mjs. Edit docs/rules/notes/ instead. -->')
  out.push('')

  return out.join('\n')
}

async function renderIndex() {
  const out = []
  out.push('# Rules')
  out.push('')
  out.push(
    `${PRODUCT_NAME} ships ${allRules.length} rules across four layers. Each page says what the rule ` +
      'detects, why it matters, which standard it maps to, code that triggers it, code that does not, ' +
      'and how to turn it off.',
  )
  out.push('')
  out.push(`_${AUTOMATED_COVERAGE_NOTE}_`)
  out.push('')
  out.push('See also: [What Attest cannot detect](../what-attest-cannot-detect.md).')
  out.push('')

  const layers = ['runtime-a11y', 'static-a11y', 'static-privacy', 'client-impact']
  for (const layer of layers) {
    const rules = allRules.filter((r) => r.kind === layer)
    if (rules.length === 0) continue
    out.push(`## ${layerLabel(layer)}`)
    out.push('')
    out.push(layerBlurb(layer))
    out.push('')
    out.push('| Rule | Severity | Standard |')
    out.push('| --- | --- | --- |')
    for (const rule of rules) {
      const standards = rule.standards
        .map((s) => (s.framework === 'wcag21' ? `WCAG ${s.id} ${s.level ?? ''}`.trim() : s.id))
        .join(', ')
      const flag = rule.experimental ? ' _(experimental)_' : ''
      out.push(`| [\`${rule.id}\`](${rule.docs}.md)${flag} | ${rule.severity} | ${standards} |`)
    }
    out.push('')
  }

  out.push('---')
  out.push('')
  out.push('<!-- Generated by scripts/generate-rule-docs.mjs. -->')
  out.push('')
  return out.join('\n')
}

async function readNotes(slug) {
  const path = join(notesDir, `${slug}.md`)
  if (!existsSync(path)) return {}
  const text = await readFile(path, 'utf8')
  return {
    why: section(text, 'Why it matters'),
    fix: section(text, 'How to fix it'),
    limits: section(text, 'What this rule will not catch'),
  }
}

function section(text, heading) {
  const pattern = new RegExp(`^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s|\\Z)`, 'm')
  const match = text.match(pattern)
  return match ? match[1].trim() || undefined : undefined
}

async function embed(fixturePath) {
  const absolute = join(repoRoot, fixturePath)
  if (!existsSync(absolute)) return `_Fixture \`${fixturePath}\` is missing._`
  const source = (await readFile(absolute, 'utf8')).trimEnd()
  const language = fixturePath.endsWith('.html')
    ? 'html'
    : fixturePath.endsWith('.tsx')
      ? 'tsx'
      : 'ts'
  return [`\`${fixturePath}\``, '', '```' + language, source, '```'].join('\n')
}

function layerLabel(kind) {
  switch (kind) {
    case 'runtime-a11y':
      return 'Runtime accessibility (axe-core in a real browser)'
    case 'static-a11y':
      return 'Static accessibility (source analysis)'
    case 'static-privacy':
      return 'Privacy and placement (source analysis)'
    case 'client-impact':
      return 'Client impact'
    default:
      return kind
  }
}

function layerBlurb(kind) {
  switch (kind) {
    case 'runtime-a11y':
      return (
        'These run axe-core against your rendered DOM and need a running application and a browser. ' +
        'The detection is axe-core\'s, maintained by Deque Systems; we map its rule ids to our own ' +
        'severities and to the success criteria they correspond to, and link back to Deque\'s ' +
        'explanation for each. If a URL is not given these rules do not run, and the report says so.'
      )
    case 'static-a11y':
      return (
        'These read source and need no browser, so they run on every pull request including ones that ' +
        'touch components no CI job renders. They are narrower than the runtime rules by design. ' +
        'Several overlap with `eslint-plugin-jsx-a11y`; where they do, the page says so and tells you ' +
        'which to turn off.'
      )
    case 'static-privacy':
      return (
        'These read source for boundary violations no rendered page can reveal: data crossing from ' +
        'session scope into shared scope, server-only values reaching the browser, effects repeated ' +
        'under retry. This is the layer with no equivalent elsewhere.'
      )
    case 'client-impact':
      return 'These report what a change costs the browser: startup JavaScript and round trips.'
    default:
      return ''
  }
}

function frameworkLabel(framework) {
  switch (framework) {
    case 'wcag21':
      return 'WCAG 2.1'
    case 'en301549':
      return 'EN 301 549'
    default:
      return 'Attest property'
  }
}

function defaultWhy(rule) {
  const wcag = rule.standards.filter((s) => s.framework === 'wcag21')
  if (wcag.length > 0) {
    return (
      `This maps to ${wcag
        .map((s) => `WCAG 2.1 success criterion ${s.id} ${s.title} (Level ${s.level})`)
        .join(' and ')}. EN 301 549, the harmonised European standard referenced by the European ` +
      'Accessibility Act, incorporates WCAG 2.1 Level AA in full, so a failure here is a failure ' +
      'against the standard European regulators assess against. See ' +
      '[regulatory context](../regulatory-context.md); this is not legal advice.'
    )
  }
  return (
    'No published standard enumerates this requirement. It is reported because it causes a defect ' +
    'that is expensive to diagnose after the fact and cheap to avoid at review time.'
  )
}

function defaultFix(rule) {
  const deque = rule.standards.find((s) => s.url?.includes('dequeuniversity'))
  const suffix = deque
    ? ` Deque's page for the underlying axe-core rule has the full treatment: ${deque.url}.`
    : ''
  return `Each finding carries the specific fix for that instance in its \`help\` field.${suffix}`
}

// Keep the notes directory discoverable even when it is empty.
const notes = await readdir(notesDir).catch(() => [])
if (notes.length === 0 && !check) {
  await writeFile(
    join(notesDir, 'README.md'),
    [
      '# Rule notes',
      '',
      'Optional prose spliced into a generated rule page. One file per rule, named for the rule\'s',
      '`docs` slug. Supported headings:',
      '',
      '- `## Why it matters`',
      '- `## How to fix it`',
      '- `## What this rule will not catch`',
      '',
      'A rule with no notes file still gets a complete, accurate page from its own metadata. Write a',
      'notes file when there is judgement to record that metadata cannot carry.',
      '',
    ].join('\n'),
    'utf8',
  )
}
