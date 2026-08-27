import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  COMMENT_MARKER,
  diffReports,
  parseReport,
  readReport,
  renderPrComment,
  ReportFormatError,
} from '@attestci/core'
import { collectingIo } from '../src/io.js'
import { runCli } from '../src/cli.js'

/**
 * End to end, through the real CLI, on a real directory.
 *
 * The test that matters most here is `survives an unrelated edit above a
 * finding`. If that ever fails, every pull request that touches a file reports
 * every pre-existing finding in it as new, the comment becomes noise, and the
 * product's central claim is false.
 */

const temporaryDirs: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function project(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'attest-e2e-'))
  temporaryDirs.push(dir)
  for (const [path, content] of Object.entries(files)) {
    const target = join(dir, path)
    await mkdir(join(target, '..'), { recursive: true })
    await writeFile(target, content, 'utf8')
  }
  return dir
}

async function scan(dir: string, output: string, extra: string[] = []): Promise<number> {
  const io = collectingIo()
  return runCli(['scan', dir, '-q', '--fail-on', 'never', '--json', output, ...extra], io)
}

const BEFORE = `
export async function loadProfile(token: string) {
  const response = await fetch('https://api.example.com/v2/customer_profile', {
    headers: { Authorization: \`Bearer \${token}\` },
    next: { revalidate: 3600 },
  })
  return response.json()
}
`

describe('attest scan', () => {
  it('produces a report with a verifiable content hash', async () => {
    const dir = await project({ 'src/api.ts': BEFORE })
    const out = join(dir, 'report.json')

    expect(await scan(dir, out)).toBe(0)

    const report = await readReport(out)
    expect(report.schemaVersion).toBe('1')
    expect(report.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/)
    expect(report.findings.some((f) => f.ruleId === 'privacy/session-data-in-shared-cache')).toBe(true)
  })

  it('hashes identical code identically, on a different path and at a different time', async () => {
    const dirA = await project({ 'src/api.ts': BEFORE })
    const dirB = await project({ 'src/api.ts': BEFORE })

    await scan(dirA, join(dirA, 'a.json'))
    await scan(dirB, join(dirB, 'b.json'))

    const a = await readReport(join(dirA, 'a.json'))
    const b = await readReport(join(dirB, 'b.json'))

    // Different scan ids and timestamps, same content hash: that is what makes
    // the hash checkable by someone who was not there.
    expect(a.scan.id).not.toBe(b.scan.id)
    expect(a.contentHash).toBe(b.contentHash)
  })

  it('records a suppression instead of dropping the finding', async () => {
    const dir = await project({
      'src/api.ts': `
export async function loadProfile(token: string) {
  // attest-disable-next-line privacy/session-data-in-shared-cache -- responses are public, token is for rate limiting
  const response = await fetch('https://api.example.com/v2/customer_profile', {
    headers: { Authorization: \`Bearer \${token}\` },
    next: { revalidate: 3600 },
  })
  return response.json()
}
`,
    })
    const out = join(dir, 'report.json')
    await scan(dir, out)
    const report = await readReport(out)

    expect(report.findings.some((f) => f.ruleId === 'privacy/session-data-in-shared-cache')).toBe(false)
    expect(report.suppressed).toHaveLength(1)
    expect(report.suppressed[0]!.reason).toBe('responses are public, token is for rate limiting')
  })

  it('reports the runtime layer as not run rather than as clean', async () => {
    const dir = await project({ 'src/api.ts': BEFORE })
    const out = join(dir, 'report.json')
    await scan(dir, out)
    const report = await readReport(out)

    const runtime = report.coverage.layers.find((l) => l.kind === 'runtime-a11y')!
    expect(runtime.ran).toBe(false)
    expect(runtime.reason).toContain('no URLs')
  })

  it('exits 1 when findings reach the threshold and 0 when they do not', async () => {
    const dir = await project({ 'src/api.ts': BEFORE })
    const io = collectingIo()
    expect(await runCli(['scan', dir, '-q', '--fail-on', 'critical'], io)).toBe(1)
    expect(await runCli(['scan', dir, '-q', '--fail-on', 'never'], io)).toBe(0)
  })
})

describe('attest diff', () => {
  it('survives an unrelated edit above a finding', async () => {
    const dir = await project({ 'src/api.ts': BEFORE })
    await scan(dir, join(dir, 'base.json'))

    // Twelve new lines above the existing finding, and nothing else changed.
    await writeFile(
      join(dir, 'src/api.ts'),
      `import { z } from 'zod'\n\n${'// a comment\n'.repeat(10)}${BEFORE}`,
      'utf8',
    )
    await scan(dir, join(dir, 'head.json'))

    const diff = diffReports(await readReport(join(dir, 'base.json')), await readReport(join(dir, 'head.json')))

    expect(diff.privacy.added).toHaveLength(0)
    expect(diff.privacy.removed).toHaveLength(0)
    expect(diff.privacy.persisting).toHaveLength(1)
    expect(diff.verdict).toBe('unchanged')
  })

  it('names the boundary that changed', async () => {
    const dir = await project({ 'src/api.ts': BEFORE })
    await scan(dir, join(dir, 'base.json'))

    await writeFile(
      join(dir, 'src/api.ts'),
      `${BEFORE}
export async function loadEntitlements(token: string) {
  const response = await fetch('https://api.example.com/v2/entitlements', {
    headers: { Authorization: \`Bearer \${token}\` },
    cache: 'force-cache',
  })
  return response.json()
}
`,
      'utf8',
    )
    await scan(dir, join(dir, 'head.json'))

    const head = await readReport(join(dir, 'head.json'))
    const diff = diffReports(await readReport(join(dir, 'base.json')), head)

    expect(diff.verdict).toBe('regressed')
    expect(diff.privacy.added).toHaveLength(1)
    expect(diff.privacy.boundaryChanges).toEqual([
      expect.objectContaining({
        subject: 'entitlements',
        from: 'session-private',
        to: 'reachable from shared cache',
      }),
    ])

    const comment = renderPrComment(diff, head)
    expect(comment).toContain(COMMENT_MARKER)
    expect(comment).toContain('Privacy boundary changed')
    expect(comment).toContain('entitlements: session-private → reachable from shared cache')
    // Every surface carries the limits with it.
    expect(comment).toContain('does not attempt them')
    expect(comment).toContain('axe-core')
  })

  it('refuses to compare a layer that ran on only one side', async () => {
    const dir = await project({ 'src/api.ts': BEFORE })
    await scan(dir, join(dir, 'base.json'))
    const base = await readReport(join(dir, 'base.json'))

    // Pretend the base scan had rendered pages and found two violations.
    const withRuntime = structuredClone(base) as typeof base
    ;(withRuntime.coverage.layers as Array<{ kind: string; ran: boolean; rulesRun: number; unitsExamined: number; unitLabel: string }>)
      .push({ kind: 'runtime-a11y', ran: true, rulesRun: 14, unitsExamined: 3, unitLabel: 'pages rendered' })
    ;(withRuntime.findings as unknown[]).push({
      ...base.findings[0]!,
      ruleId: 'a11y/image-alt',
      kind: 'runtime-a11y',
      fingerprint: 'runtimeonly0000000000000000000000',
    })

    const diff = diffReports(withRuntime, base)

    // The runtime finding must NOT appear as resolved: the head scan never
    // rendered a page, so it has no opinion about it.
    expect(diff.accessibility.removed).toHaveLength(0)
    expect(diff.incomparableLayers).toContain('runtime-a11y')
  })
})

describe('report integrity', () => {
  it('rejects a report whose contents no longer match its hash', async () => {
    const dir = await project({ 'src/api.ts': BEFORE })
    const out = join(dir, 'report.json')
    await scan(dir, out)

    const tampered = JSON.parse(await readFile(out, 'utf8')) as { findings: unknown[] }
    tampered.findings = []

    expect(() => parseReport(JSON.stringify(tampered))).toThrow(ReportFormatError)
    expect(() => parseReport(JSON.stringify(tampered))).toThrow(/modified since it was produced/)
  })
})

describe('attest badge', () => {
  it('reports a count and never claims conformance', async () => {
    const dir = await project({ 'src/api.ts': BEFORE })
    const out = join(dir, 'report.json')
    await scan(dir, out)

    const io = collectingIo()
    expect(await runCli(['badge', out], io)).toBe(0)
    const svg = io.stdout.join('\n')

    expect(svg).toContain('<svg')
    expect(svg).toMatch(/\d+ findings?/)
    expect(svg.toLowerCase()).not.toContain('passing')
    expect(svg.toLowerCase()).not.toContain('accessible')
    expect(svg.toLowerCase()).not.toContain('compliant')
  })
})

describe('attest help', () => {
  it('states the coverage limit in the help text itself', async () => {
    const io = collectingIo()
    expect(await runCli(['--help'], io)).toBe(0)
    // The help text is hard-wrapped, so compare on normalised whitespace.
    const help = io.stdout.join('\n').replace(/\s+/g, ' ')
    expect(help).toContain('It does not make you compliant, and no tool can.')
    expect(help).toContain('quarter to a third')
    expect(help).toContain('axe-core')
  })
})
