import type { AnyRule } from '@attestci/core'
import { staticA11yRules, runtimeRules } from '@attestci/rules-a11y'
import { privacyRules, clientImpactRules } from '@attestci/rules-privacy'

/**
 * Every rule the CLI ships, in one list.
 *
 * The docs generator, the `rules` command and the docs-coverage check all read
 * this, so a rule that is registered is documented or CI fails.
 */
export const allRules: readonly AnyRule[] = [
  ...staticA11yRules,
  ...runtimeRules,
  ...privacyRules,
  ...clientImpactRules,
]

export function findRule(id: string): AnyRule | undefined {
  return allRules.find((rule) => rule.id === id)
}
