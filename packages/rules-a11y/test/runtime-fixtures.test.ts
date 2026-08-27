import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AddressInfo } from 'node:net'
import { resolveConfig, type ScanInput } from '@attestci/core'
import { createRuntimeA11yPack, runtimeRules } from '../src/index.js'
import type { RuntimeA11yContext } from '../src/runtime/context.js'

/**
 * The runtime rules are tested the way they run in production: a real browser
 * loading a real page, with axe-core injected into it.
 *
 * When no browser is available the suite skips rather than fails. That mirrors
 * what the product does — a missing browser is reported as "this layer did not
 * run", never as a clean result — and it keeps the check useful on machines
 * that have not downloaded 150MB of Chromium.
 */

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))
const fixtureRoot = join(repoRoot, 'fixtures/a11y-runtime')

function resolveChromium(): string | undefined {
  const fromEnv = process.env.ATTEST_CHROMIUM_PATH
  if (fromEnv && existsSync(fromEnv)) return fromEnv

  // Images that pre-install browsers put them here and name the directory for
  // the build revision, which will not match whatever playwright expects.
  const shared = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (shared && existsSync(shared)) {
    for (const entry of readdirSync(shared)) {
      if (!entry.startsWith('chromium-')) continue
      const candidate = join(shared, entry, 'chrome-linux', 'chrome')
      if (existsSync(candidate)) return candidate
    }
  }
  return undefined
}

let server: Server | undefined
let baseUrl = ''
let context: RuntimeA11yContext | undefined
let skipReason = ''

beforeAll(async () => {
  server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0] ?? '/'
    readFile(join(fixtureRoot, path)).then(
      (body) => {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
        res.end(body)
      },
      () => {
        res.writeHead(404)
        res.end('not found')
      },
    )
  })
  await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`

  const urls = runtimeRules.flatMap((rule) =>
    [...rule.fixtures.triggering, ...rule.fixtures.clean].map((p) => toUrl(p)),
  )

  const pack = createRuntimeA11yPack({ executablePath: resolveChromium() })
  const input: ScanInput = {
    rootDir: repoRoot,
    files: [],
    urls,
    config: resolveConfig(undefined, { urls }),
    shared: new Map(),
  }

  const created = await pack.createContext(input)
  if (created.status === 'skipped') skipReason = created.reason
  else context = created.context
}, 240_000)

afterAll(async () => {
  await new Promise<void>((resolve) => server?.close(() => resolve()) ?? resolve())
})

function toUrl(fixturePath: string): string {
  return `${baseUrl}/${fixturePath.replace('fixtures/a11y-runtime/', '')}`
}

describe('runtime accessibility rules', () => {
  for (const rule of runtimeRules) {
    it(`${rule.id} fires on its triggering page and not on its clean one`, async () => {
      if (!context) {
        // Not a silent pass: the reason is printed so a CI run that skipped is
        // distinguishable from one that checked.
        console.warn(`skipped ${rule.id}: ${skipReason}`)
        return
      }

      const findings = await rule.check(context)
      const urls = findings.map((f) => (f.location.kind === 'dom' ? f.location.url : ''))

      for (const fixture of rule.fixtures.triggering) {
        expect(urls, `${rule.id} should fire on ${fixture}`).toContain(toUrl(fixture))
      }
      for (const fixture of rule.fixtures.clean) {
        expect(urls, `${rule.id} should stay silent on ${fixture}`).not.toContain(toUrl(fixture))
      }
    })
  }

  it('reports the axe-core version it ran, so a report can be reproduced', () => {
    if (!context) return
    expect(context.axeVersion).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('carries the axe help URL into every finding', async () => {
    if (!context) return
    const rule = runtimeRules.find((r) => r.id === 'a11y/image-alt')!
    const findings = await rule.check(context)
    expect(findings.length).toBeGreaterThan(0)
    expect(findings[0]!.help).toContain('dequeuniversity.com')
  })
})
