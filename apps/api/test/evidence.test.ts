import { describe, expect, it } from 'vitest'
import { computeContentHash, type ScanReport } from '@attestci/core'
import {
  computeChainHash,
  generateSigningKeypair,
  signManifest,
  verifyChain,
  verifyManifest,
  verifyReport,
  type ChainLink,
  type ExportManifest,
} from '../src/evidence.js'
import { generateStatement } from '../src/statement.js'

function report(overrides: Partial<ScanReport> = {}): ScanReport {
  const base: ScanReport = {
    schemaVersion: '1',
    tool: { name: 'Attest', version: '0.1.0' },
    scan: {
      id: '00000000-0000-4000-8000-000000000000',
      startedAt: '2026-03-03T09:00:00.000Z',
      finishedAt: '2026-03-03T09:00:07.000Z',
      durationMs: 7000,
    },
    target: { rootDir: '/tmp/x', urls: [] },
    rulesRun: ['a11y/label-association'],
    rulesSkipped: [],
    findings: [],
    suppressed: [],
    metrics: {},
    coverage: {
      layers: [
        { kind: 'static-a11y', ran: true, rulesRun: 6, unitsExamined: 40, unitLabel: 'source files' },
        { kind: 'runtime-a11y', ran: false, reason: 'no URLs were given', rulesRun: 0, unitsExamined: 0, unitLabel: 'n/a' },
      ],
      note: 'Automated tooling can evaluate roughly a quarter to a third of WCAG 2.1 success criteria.',
      ...overrides.coverage,
    },
    disclaimer: 'Attest reports the results of automated checks.',
    contentHash: '',
    ...overrides,
  }
  base.contentHash = computeContentHash(base)
  return base
}

function chainOf(count: number): ChainLink[] {
  const links: ChainLink[] = []
  let prev: string | null = null
  for (let i = 0; i < count; i++) {
    const contentHash = `sha256:${String(i).padStart(64, '0')}`
    const scannedAt = `2026-03-0${i + 1}T09:00:00.000Z`
    const chainHash = computeChainHash(prev, contentHash, scannedAt)
    links.push({ contentHash, prevHash: prev, chainHash, scannedAt })
    prev = chainHash
  }
  return links
}

describe('hash chain', () => {
  it('accepts an intact chain', () => {
    expect(verifyChain(chainOf(5))).toEqual({ valid: true, brokenAt: -1 })
  })

  it('accepts an empty history', () => {
    expect(verifyChain([]).valid).toBe(true)
  })

  it('names the record where a link was removed', () => {
    const links = chainOf(5)
    links.splice(2, 1)

    const result = verifyChain(links)
    expect(result.valid).toBe(false)
    expect(result.brokenAt).toBe(2)
    // "The chain is invalid" helps nobody. This has to say which record.
    expect(result.reason).toContain('2026-03-04')
    expect(result.reason).toContain('removed, reordered, or altered')
  })

  it('catches a record whose contents were altered in place', () => {
    const links = chainOf(4)
    links[2] = { ...links[2]!, contentHash: `sha256:${'f'.repeat(64)}` }

    const result = verifyChain(links)
    expect(result.valid).toBe(false)
    expect(result.brokenAt).toBe(2)
  })

  it('catches two records swapped', () => {
    const links = chainOf(5)
    const [a, b] = [links[1]!, links[2]!]
    links[1] = b
    links[2] = a

    expect(verifyChain(links).valid).toBe(false)
  })
})

describe('report verification', () => {
  it('accepts a report that matches its own hash', () => {
    expect(verifyReport(report())).toBe(true)
  })

  it('rejects a report whose findings were removed after the fact', () => {
    const tampered = { ...report(), findings: [] }
    tampered.rulesRun = ['a11y/label-association', 'a11y/positive-tabindex']
    expect(verifyReport(tampered)).toBe(false)
  })
})

describe('export signing', () => {
  const manifest: ExportManifest = {
    schemaVersion: '1',
    tool: 'Attest 0.1.0',
    repository: 'acme/storefront',
    generatedAt: '2026-03-03T10:00:00.000Z',
    scanCount: 3,
    from: { scannedAt: '2026-03-01T09:00:00.000Z', contentHash: 'sha256:aaa' },
    to: { scannedAt: '2026-03-03T09:00:00.000Z', contentHash: 'sha256:ccc' },
    chain: chainOf(3),
    disclaimer: 'x',
    coverageNote: 'y',
    verificationInstructions: 'z',
  }

  it('round-trips a signature', () => {
    const { publicKey, privateKey } = generateSigningKeypair()
    const signature = signManifest(manifest, privateKey)
    expect(verifyManifest(manifest, signature, publicKey)).toBe(true)
  })

  it('fails verification when the manifest is edited', () => {
    const { publicKey, privateKey } = generateSigningKeypair()
    const signature = signManifest(manifest, privateKey)
    expect(verifyManifest({ ...manifest, scanCount: 4 }, signature, publicKey)).toBe(false)
  })

  it('fails verification under a different key', () => {
    const { privateKey } = generateSigningKeypair()
    const other = generateSigningKeypair()
    const signature = signManifest(manifest, privateKey)
    expect(verifyManifest(manifest, signature, other.publicKey)).toBe(false)
  })
})

describe('accessibility statement drafting', () => {
  const input = {
    organisationName: 'Acme GmbH',
    serviceName: 'Acme Storefront',
    serviceUrl: 'https://acme.example',
    feedbackEmail: 'accessibility@acme.example',
    reports: [report()],
  }

  it('never states a conformance level', () => {
    const { markdown } = generateStatement(input)
    expect(markdown).toContain('cannot determine which of those applies')
    expect(markdown).not.toMatch(/is (fully|partially) conformant/i)
  })

  it('is marked as a draft that must not be published unread', () => {
    const { markdown } = generateStatement(input)
    expect(markdown).toContain('DRAFT')
    expect(markdown).toContain('It is not ready to publish')
  })

  it('names the layers that did not run', () => {
    const { markdown, basis } = generateStatement(input)
    expect(markdown).toContain('did **not** cover')
    expect(markdown).toContain('no URLs were given')
    expect(basis.layersNotRun).toContain('runtime-a11y')
  })

  it('returns the human decisions still outstanding', () => {
    const { todos } = generateStatement(input)
    expect(todos.length).toBeGreaterThan(3)
    expect(todos.join(' ')).toContain('conformance status')
    expect(todos.join(' ')).toContain('manual evaluation')
  })

  it('records the report hashes it drew on, so the draft is checkable', () => {
    const { basis } = generateStatement(input)
    expect(basis.reportHashes).toEqual([input.reports[0]!.contentHash])
  })

  it('does not present a clean scan as an absence of barriers', () => {
    const { markdown } = generateStatement(input)
    expect(markdown).toContain('not a statement that the service has no accessibility barriers')
  })

  it('refuses to draft from nothing', () => {
    expect(() => generateStatement({ ...input, reports: [] })).toThrow(/no scan reports/)
  })
})
