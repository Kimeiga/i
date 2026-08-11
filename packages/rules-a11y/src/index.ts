import type { Rule, RulePack, ScanInput } from '@attestci/core'
import { createStaticContext, type StaticContext } from '@attestci/core/static'
import { createRuntimeContext, type RuntimeA11yContext, type RuntimeOptions } from './runtime/context.js'
import { runtimeRules } from './runtime/rules.js'

import controlWithoutAccessibleName from './static/rules/control-without-accessible-name.js'
import labelAssociation from './static/rules/label-association.js'
import formErrorNotAssociated from './static/rules/form-error-not-associated.js'
import ariaHiddenContainsFocusable from './static/rules/aria-hidden-contains-focusable.js'
import positiveTabindex from './static/rules/positive-tabindex.js'
import clickWithoutKeyboard from './static/rules/click-without-keyboard.js'

export const staticA11yRules: ReadonlyArray<Rule<StaticContext>> = [
  controlWithoutAccessibleName,
  labelAssociation,
  formErrorNotAssociated,
  ariaHiddenContainsFocusable,
  positiveTabindex,
  clickWithoutKeyboard,
]

export { runtimeRules }

export const staticA11yPack: RulePack<StaticContext> = {
  id: 'a11y-static',
  kind: 'static-a11y',
  rules: staticA11yRules,
  createContext: (input: ScanInput) => createStaticContext(input),
}

/**
 * The runtime pack is created through a factory so the CLI can pass a browser
 * path without the pack reaching into process.env from library code.
 */
export function createRuntimeA11yPack(options: RuntimeOptions = {}): RulePack<RuntimeA11yContext> {
  return {
    id: 'a11y-runtime',
    kind: 'runtime-a11y',
    rules: runtimeRules,
    createContext: (input: ScanInput) => createRuntimeContext(input, options),
  }
}

export const runtimeA11yPack = createRuntimeA11yPack()

export const packs = [staticA11yPack, runtimeA11yPack] as const
export const allRules = [...staticA11yRules, ...runtimeRules]

export * from './wcag.js'
export { makeRuntimeContext, DEFAULT_AXE_TAGS } from './runtime/context.js'
export type { RuntimeA11yContext, RuntimeOptions, PageResult, AxeViolation } from './runtime/context.js'
export { axeRule } from './runtime/axe-rule.js'
