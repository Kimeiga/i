import { AUTOMATED_COVERAGE_NOTE, RULE_DOCS_URL, wrap } from '@attestci/core'
import { allRules, findRule } from '../rules.js'
import type { CliIo } from '../io.js'

export interface RulesOptions {
  json?: boolean
  kind?: string
}

/** `attest rules` — what this build checks, and what it does not. */
export function rulesCommand(options: RulesOptions, io: CliIo): number {
  const rules = options.kind ? allRules.filter((r) => r.kind === options.kind) : allRules

  if (options.json) {
    io.out(
      JSON.stringify(
        rules.map((rule) => ({
          id: rule.id,
          kind: rule.kind,
          title: rule.title,
          severity: rule.severity,
          experimental: rule.experimental ?? false,
          standards: rule.standards,
          docs: `${RULE_DOCS_URL}/${rule.docs}`,
        })),
        null,
        2,
      ),
    )
    return 0
  }

  const byKind = new Map<string, typeof rules>()
  for (const rule of rules) {
    byKind.set(rule.kind, [...(byKind.get(rule.kind) ?? []), rule])
  }

  for (const [kind, group] of byKind) {
    io.out(kind)
    for (const rule of group) {
      const flags = [rule.severity, rule.experimental ? 'experimental, off by default' : undefined]
        .filter(Boolean)
        .join(', ')
      io.out(`  ${rule.id.padEnd(46)} ${rule.title}`)
      io.out(`  ${''.padEnd(46)} ${flags}`)
    }
    io.out('')
  }

  io.out(wrap(AUTOMATED_COVERAGE_NOTE, 88))
  return 0
}

/** `attest explain <rule-id>` — the rule in full, without opening a browser. */
export function explainCommand(id: string, io: CliIo): number {
  const rule = findRule(id)
  if (!rule) {
    io.error(`No rule with id "${id}". Run \`attest rules\` to list them.`)
    return 2
  }

  io.out(rule.id)
  io.out('')
  io.out(wrap(rule.description, 88))
  io.out('')
  io.out(`Kind:     ${rule.kind}`)
  io.out(`Severity: ${rule.severity}`)
  if (rule.experimental) io.out('Status:   experimental — enable it explicitly in config')
  io.out('')
  io.out('Standards')
  for (const standard of rule.standards) {
    const level = standard.level ? ` (Level ${standard.level})` : ''
    io.out(`  ${standard.framework} ${standard.id}${level} — ${standard.title}`)
    if (standard.url) io.out(`    ${standard.url}`)
  }
  io.out('')
  io.out('Fixtures')
  for (const path of rule.fixtures.triggering) io.out(`  triggers: ${path}`)
  for (const path of rule.fixtures.clean) io.out(`  clean:    ${path}`)
  io.out('')
  io.out(`Docs: ${RULE_DOCS_URL}/${rule.docs}`)
  io.out('')
  io.out(`Suppress a single instance with:  // attest-disable-next-line ${rule.id} -- reason`)
  io.out('Suppressions are recorded in the report, with the reason.')
  return 0
}
