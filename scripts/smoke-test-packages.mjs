#!/usr/bin/env node
/**
 * Packs the publishable packages and installs them into a clean project, the
 * way a user would get them.
 *
 * This exists because the first time it was run it found a genuine release
 * blocker: `npm pack` leaves pnpm's `workspace:*` protocol in the manifest, so
 * the tarball fails to install with EUNSUPPORTEDPROTOCOL. Reading the manifest
 * would not have shown it — the workspace build works fine, the types resolve,
 * the tests pass. Only installing the packed artefact reveals it.
 *
 * Anything that would embarrass a launch belongs here: the bin not being
 * executable, a subpath export missing from `files`, a dependency that was only
 * ever available because the workspace hoisted it.
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const exec = promisify(execFile)
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const PACKAGES = ['core', 'rules-a11y', 'rules-privacy', 'cli']

const workDir = await mkdtemp(join(tmpdir(), 'attest-smoke-'))
const tarballs = join(workDir, 'tarballs')
await mkdir(tarballs, { recursive: true })

let failed = false
const step = async (label, fn) => {
  process.stdout.write(`  ${label}… `)
  try {
    const detail = await fn()
    console.log(detail ? `ok — ${detail}` : 'ok')
  } catch (error) {
    console.log('FAILED')
    console.error(`\n${error.stdout ?? ''}${error.stderr ?? error.message}\n`)
    failed = true
  }
}

console.log('Packing with pnpm (npm would leave workspace:* unresolved)\n')

for (const name of PACKAGES) {
  await step(`pack @attestci/${name}`, async () => {
    await exec('pnpm', ['pack', '--pack-destination', tarballs], {
      cwd: join(repoRoot, 'packages', name),
    })
  })
}

await step('manifest has no workspace: protocol', async () => {
  const { stdout } = await exec('tar', [
    '-xzOf',
    join(tarballs, 'attestci-cli-0.1.0.tgz'),
    'package/package.json',
  ])
  if (stdout.includes('workspace:')) {
    throw new Error('the packed manifest still contains workspace:* — publish with pnpm')
  }
  const manifest = JSON.parse(stdout)
  return Object.entries(manifest.dependencies ?? {})
    .map(([k, v]) => `${k}@${v}`)
    .join(' ')
})

await step('install into a clean project', async () => {
  await writeFile(
    join(workDir, 'package.json'),
    JSON.stringify({ name: 'attest-smoke', private: true, version: '1.0.0' }),
  )
  const files = PACKAGES.map((name) =>
    join(tarballs, `attestci-${name === 'core' ? 'core' : name}-0.1.0.tgz`),
  )
  await exec('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error', ...files], {
    cwd: workDir,
    timeout: 300_000,
  })
})

const bin = join(workDir, 'node_modules', '.bin', 'attest')

await step('the bin runs', async () => {
  const { stdout } = await exec(bin, ['--version'], { cwd: workDir })
  return stdout.trim()
})

await step('every rule loads from the installed packages', async () => {
  const { stdout } = await exec(bin, ['rules', '--json'], { cwd: workDir })
  const rules = JSON.parse(stdout)
  if (rules.length < 30) throw new Error(`only ${rules.length} rules loaded, expected 30`)
  return `${rules.length} rules`
})

await step('a real scan finds a real finding', async () => {
  await mkdir(join(workDir, 'src'), { recursive: true })
  await writeFile(
    join(workDir, 'src', 'api.ts'),
    [
      'export async function loadProfile(token: string) {',
      "  const r = await fetch('https://api.example.com/v2/customer_profile', {",
      '    headers: { Authorization: `Bearer ${token}` },',
      '    next: { revalidate: 3600 },',
      '  })',
      '  return r.json()',
      '}',
    ].join('\n'),
  )

  const { stdout } = await exec(
    bin,
    ['scan', '.', '-q', '--fail-on', 'never', '--format', 'json'],
    { cwd: workDir, maxBuffer: 20 * 1024 * 1024 },
  )
  const report = JSON.parse(stdout)
  const found = report.findings.some((f) => f.ruleId === 'privacy/session-data-in-shared-cache')
  if (!found) throw new Error('the flagship rule did not fire on a known-triggering file')
  if (!report.contentHash?.startsWith('sha256:')) throw new Error('no content hash')
  return `${report.findings.length} finding(s), hash ${report.contentHash.slice(0, 20)}…`
})

await step('the runtime layer reports itself as skipped, not clean', async () => {
  const { stdout } = await exec(bin, ['scan', '.', '-q', '--fail-on', 'never', '--format', 'json'], {
    cwd: workDir,
    maxBuffer: 20 * 1024 * 1024,
  })
  const report = JSON.parse(stdout)
  const runtime = report.coverage.layers.find((l) => l.kind === 'runtime-a11y')
  if (runtime?.ran !== false || !runtime.reason) {
    throw new Error('runtime layer did not report a skip reason')
  }
})

await rm(workDir, { recursive: true, force: true })

console.log('')
if (failed) {
  console.error('smoke-test-packages: the published form is broken. Do not release.')
  process.exit(1)
}
console.log('smoke-test-packages: the published form installs and works')
