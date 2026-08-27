#!/usr/bin/env node
/**
 * Runs Attest against the exported site, served the way it is actually served.
 *
 * The site used to be checked by starting `next start` and pointing the scanner
 * at it. That stopped being honest the moment the site became a static export:
 * `next start` is a Node server the deployed site no longer has, and it applies
 * `headers()` and `redirects()` from `next.config.ts`, which a static export
 * ignores entirely. A check that passes against a server nobody runs is not a
 * check.
 *
 * So this starts `wrangler dev`, which runs the real Worker in the real runtime
 * with the real asset routing, `_headers` and `_redirects` — the same code path
 * as production, locally and with no credentials.
 *
 * Usage: node scripts/scan-exported-site.mjs [--port 3111]
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const webDir = path.join(root, 'apps', 'web')
const outDir = path.join(webDir, 'out')

const portArg = process.argv.indexOf('--port')
const port = portArg === -1 ? 3111 : Number(process.argv[portArg + 1])
const origin = `http://127.0.0.1:${port}`

/**
 * The routes the site is checked against, in one place so ci.yml and deploy.yml
 * cannot drift apart. Trailing slashes are deliberate: `trailingSlash: true`
 * exports every route as `route/index.html`, so anything else takes a redirect.
 */
const ROUTES = [
  '/',
  '/pricing/',
  '/dashboard/',
  '/for/github/',
  '/for/eaa/',
  '/compare/',
  '/v1/',
  '/scans/',
  '/docs/what-attest-cannot-detect/',
]

if (!existsSync(outDir)) {
  fail(`No export at ${outDir}. Run \`pnpm --filter @attestci/web build\` first.`)
}

const server = spawn(
  'node_modules/.bin/wrangler',
  ['dev', '--port', String(port), '--ip', '127.0.0.1'],
  {
    cwd: webDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  },
)

let serverLog = ''
server.stdout.on('data', (chunk) => {
  serverLog += chunk
})
server.stderr.on('data', (chunk) => {
  serverLog += chunk
})

let exitCode = 1
try {
  await waitForServer()
  await verifyRouting()
  exitCode = await runScan()
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`)
  console.error(`\nwrangler dev output:\n${serverLog}`)
  exitCode = 1
} finally {
  server.kill('SIGTERM')
}

process.exit(exitCode)

async function waitForServer() {
  const deadline = Date.now() + 90_000
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error('wrangler dev exited before it was ready')
    try {
      const response = await fetch(`${origin}/`)
      if (response.ok) {
        console.log(`wrangler dev ready on ${origin}`)
        return
      }
    } catch {
      // Not up yet.
    }
    await sleep(500)
  }
  throw new Error(`wrangler dev did not become ready on ${origin} within 90s`)
}

/**
 * Three assertions about how the deployed site behaves that the scanner itself
 * has no opinion about, and that a static export gets wrong by default.
 */
async function verifyRouting() {
  const home = await fetch(`${origin}/`, { redirect: 'manual' })
  const csp = home.headers.get('content-security-policy')
  if (!csp || !csp.includes("default-src 'self'")) {
    throw new Error(
      `_headers was not applied: content-security-policy was ${csp ?? 'absent'}. ` +
        'A static export ignores headers() in next.config.ts, so public/_headers is ' +
        'the only thing setting these.',
    )
  }

  const notes = await fetch(`${origin}/docs/rules/notes/anything`, { redirect: 'manual' })
  if (notes.status !== 302) {
    throw new Error(`_redirects was not applied: /docs/rules/notes/* returned ${notes.status}, expected 302`)
  }

  const missing = await fetch(`${origin}/definitely-not-a-page`, { redirect: 'manual' })
  if (missing.status !== 404) {
    throw new Error(`Unknown paths returned ${missing.status}, expected 404 from the exported 404 page`)
  }

  console.log('Routing checks passed: _headers applied, _redirects applied, 404 page served.')
}

function runScan() {
  const args = ['packages/cli/dist/bin.js', 'scan', 'apps/web', '--fail-on', 'moderate']
  for (const route of ROUTES) args.push('--url', `${origin}${route}`)

  return new Promise((resolve) => {
    const scan = spawn(process.execPath, args, { cwd: root, stdio: 'inherit' })
    scan.on('exit', (code) => resolve(code ?? 1))
  })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
