import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { checkRuleFixtures, runRuleOnFixtures } from '@attestci/core/testing'
import { clientImpactPack, clientImpactRules, privacyPack, privacyRules } from '../src/index.js'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))

/**
 * The false-positive guard. Every rule proves twice over that it fires on the
 * problem and stays silent on the correct version of the same code.
 */
describe('privacy rules', () => {
  for (const rule of privacyRules) {
    it(`${rule.id} fires on its triggering fixtures and not on its clean ones`, async () => {
      const problems = await checkRuleFixtures(rule, privacyPack, repoRoot)
      expect(problems.map((p) => p.message)).toEqual([])
    })
  }
})

describe('client impact rules', () => {
  for (const rule of clientImpactRules) {
    it(`${rule.id} fires on its triggering fixtures and not on its clean ones`, async () => {
      const problems = await checkRuleFixtures(rule, clientImpactPack, repoRoot)
      expect(problems.map((p) => p.message)).toEqual([])
    })
  }
})

describe('rule metadata', () => {
  const all = [...privacyRules, ...clientImpactRules]

  it('has unique, namespaced ids', () => {
    const ids = all.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z-]+\/[a-z0-9-]+$/)
  })

  it('declares a docs slug and at least one standard for every rule', () => {
    for (const rule of all) {
      expect(rule.docs, rule.id).toBeTruthy()
      expect(rule.standards.length, rule.id).toBeGreaterThan(0)
    }
  })

  it('writes help text that says what to do, not just what is wrong', () => {
    for (const rule of all) {
      expect(rule.description.length, rule.id).toBeGreaterThan(80)
    }
  })
})

describe('session-data-in-shared-cache', () => {
  it('names the subject and the transition, so the diff can render one line', async () => {
    const rule = privacyRules.find((r) => r.id === 'privacy/session-data-in-shared-cache')!
    const { findings } = await runRuleOnFixtures(rule, privacyPack, repoRoot)

    const profile = findings.find((f) => f.boundary?.subject === 'customer_profile')
    expect(profile).toBeDefined()
    expect(profile!.boundary).toEqual({
      subject: 'customer_profile',
      from: 'session-private',
      to: 'reachable from shared cache',
    })
  })
})

describe('client graph traversal', () => {
  it('reports the env read in the helper, not in the component that imports it', async () => {
    const rule = privacyRules.find((r) => r.id === 'privacy/server-env-in-client-graph')!
    const { byFile } = await runRuleOnFixtures(rule, privacyPack, repoRoot)

    const inHelper = byFile.get('fixtures/privacy/server-env-in-client-graph/config.ts') ?? []
    expect(inHelper.length).toBe(2)
    // The whole point of the graph: the finding explains how the file got there.
    expect(inHelper[0]!.message).toContain('triggering-client.tsx')
  })
})
