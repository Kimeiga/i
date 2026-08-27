import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { checkRuleFixtures } from '@attestci/core/testing'
import { staticA11yPack, staticA11yRules, runtimeRules } from '../src/index.js'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))

describe('static accessibility rules', () => {
  for (const rule of staticA11yRules) {
    it(`${rule.id} fires on its triggering fixtures and not on its clean ones`, async () => {
      const problems = await checkRuleFixtures(rule, staticA11yPack, repoRoot)
      expect(problems.map((p) => p.message)).toEqual([])
    })
  }
})

describe('accessibility rule metadata', () => {
  const all = [...staticA11yRules, ...runtimeRules]

  it('has unique ids', () => {
    const ids = all.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps the pack inside the 12-20 rule range the product scope sets', () => {
    expect(all.length).toBeGreaterThanOrEqual(12)
    expect(all.length).toBeLessThanOrEqual(20)
  })

  it('never claims a WCAG criterion for an axe best-practice rule', () => {
    const headingOrder = runtimeRules.find((r) => r.id === 'a11y/heading-order')!
    expect(headingOrder.standards.every((s) => s.framework !== 'wcag21')).toBe(true)
  })

  it('cites a real success criterion number for every WCAG-mapped rule', () => {
    for (const rule of all) {
      for (const standard of rule.standards) {
        if (standard.framework !== 'wcag21') continue
        expect(standard.id, `${rule.id} -> ${standard.id}`).toMatch(/^\d\.\d\.\d+$/)
        expect(standard.level, `${rule.id} -> ${standard.id}`).toMatch(/^A{1,3}$/)
      }
    }
  })
})
