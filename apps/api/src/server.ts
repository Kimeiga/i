import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { createHash } from 'node:crypto'
import {
  ATTRIBUTION,
  AUTOMATED_COVERAGE_NOTE,
  DISCLAIMER,
  PRODUCT_NAME,
  assertReport,
  canonicalize,
  diffReports,
  type ScanReport,
} from '@attestci/core'
import {
  IngestError,
  deleteAccount,
  getReport,
  ingestScan,
  listScans,
  query,
  verifyRepositoryChain,
  type Account,
} from './db.js'
import {
  accountForSession,
  accountForToken,
  authorizeUrl,
  createApiToken,
  createSession,
  destroySession,
  exchangeCode,
  randomState,
  safeEqual,
} from './auth.js'
import {
  VERIFICATION_INSTRUCTIONS,
  signManifest,
  type ExportManifest,
  type SignedExport,
} from './evidence.js'
import { generateStatement } from './statement.js'
import { applyBillingEvent, verifyWebhookSignature } from './billing.js'

/**
 * The hosted API.
 *
 * Plain `node:http` with a small router. A framework would be more comfortable
 * and would add a dependency tree to a service whose main job is to store
 * documents unchanged and hand them back — the surface here is small enough
 * that the router is thirty lines and every route is visible in one file.
 */

type Handler = (ctx: Context) => Promise<void> | void

interface Context {
  req: IncomingMessage
  res: ServerResponse
  url: URL
  params: Record<string, string>
  account?: Account
  body: () => Promise<unknown>
}

interface Route {
  method: string
  pattern: RegExp
  keys: string[]
  handler: Handler
  auth: 'none' | 'session' | 'token' | 'either'
}

const routes: Route[] = []

function route(method: string, path: string, auth: Route['auth'], handler: Handler): void {
  const keys: string[] = []
  const pattern = new RegExp(
    `^${path.replace(/:([a-zA-Z]+)/g, (_, key: string) => {
      keys.push(key)
      return '([^/]+)'
    })}$`,
  )
  routes.push({ method, pattern, keys, handler, auth })
}

/* --------------------------------- health -------------------------------- */

route('GET', '/health', 'none', ({ res }) => {
  json(res, 200, { ok: true, service: PRODUCT_NAME })
})

route('GET', '/.well-known/attest-signing-key.pem', 'none', ({ res }) => {
  const key = process.env.EVIDENCE_PUBLIC_KEY
  if (!key) return json(res, 503, { error: 'no signing key is configured' })
  res.writeHead(200, { 'content-type': 'application/x-pem-file' })
  res.end(key)
})

/* ---------------------------------- auth --------------------------------- */

route('GET', '/auth/github', 'none', ({ res }) => {
  const state = randomState()
  res.writeHead(302, {
    location: authorizeUrl(state),
    'set-cookie': cookie('attest_state', state, { maxAge: 600 }),
  })
  res.end()
})

route('GET', '/auth/github/callback', 'none', async ({ req, res, url }) => {
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const expected = readCookie(req, 'attest_state')

  if (!code || !state || !expected || !safeEqual(state, expected)) {
    return json(res, 400, { error: 'invalid oauth state' })
  }

  const user = await exchangeCode(code)
  const session = await createSession(user)
  res.writeHead(302, {
    location: process.env.DASHBOARD_URL ?? '/',
    'set-cookie': cookie('attest_session', session.id, { maxAge: 60 * 60 * 24 * 30 }),
  })
  res.end()
})

route('POST', '/auth/logout', 'session', async ({ req, res }) => {
  const session = readCookie(req, 'attest_session')
  if (session) await destroySession(session)
  res.writeHead(200, { 'set-cookie': cookie('attest_session', '', { maxAge: 0 }) })
  res.end('{}')
})

route('GET', '/v1/me', 'either', ({ res, account }) => {
  json(res, 200, {
    login: account!.github_login,
    plan: account!.plan,
    retentionDays: account!.retention_days,
  })
})

route('POST', '/v1/tokens', 'session', async ({ res, account, body }) => {
  const input = (await body()) as { name?: string }
  const token = await createApiToken(account!.id, input.name ?? 'ci')
  // Shown once. There is no endpoint that reads it back, because we store only
  // its hash.
  json(res, 201, { token, note: 'Store this now. It cannot be retrieved again.' })
})

/* --------------------------------- ingest -------------------------------- */

route('POST', '/v1/repos/:owner/:repo/scans', 'token', async ({ res, account, params, body }) => {
  const fullName = `${params.owner}/${params.repo}`
  let report: ScanReport
  try {
    report = assertReport(await body())
  } catch (error) {
    return json(res, 400, { error: (error as Error).message })
  }

  try {
    const result = await ingestScan(account!.id, fullName, report)
    json(res, result.duplicate ? 200 : 201, {
      scanId: result.scanId,
      chainHash: result.chainHash,
      duplicate: result.duplicate,
      contentHash: report.contentHash,
    })
  } catch (error) {
    if (error instanceof IngestError) return json(res, 422, { error: error.message })
    throw error
  }
})

/* -------------------------------- history -------------------------------- */

route('GET', '/v1/repos/:owner/:repo/scans', 'either', async ({ res, account, params, url }) => {
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 1000)
  const scans = await listScans(account!.id, `${params.owner}/${params.repo}`, limit)
  json(res, 200, { scans, disclaimer: DISCLAIMER })
})

route('GET', '/v1/repos/:owner/:repo/verify', 'either', async ({ res, account, params }) => {
  const result = await verifyRepositoryChain(account!.id, `${params.owner}/${params.repo}`)
  json(res, result.valid ? 200 : 409, result)
})

route('GET', '/v1/scans/:id', 'either', async ({ res, account, params }) => {
  const report = await getReport(account!.id, params.id!)
  if (!report) return json(res, 404, { error: 'not found' })
  json(res, 200, report)
})

route('GET', '/v1/scans/:base/diff/:head', 'either', async ({ res, account, params }) => {
  const [base, head] = await Promise.all([
    getReport(account!.id, params.base!),
    getReport(account!.id, params.head!),
  ])
  if (!base || !head) return json(res, 404, { error: 'not found' })
  json(res, 200, diffReports(base, head))
})

/* --------------------------------- export -------------------------------- */

route('POST', '/v1/repos/:owner/:repo/export', 'either', async ({ res, account, params }) => {
  if (account!.plan !== 'team') {
    return json(res, 402, {
      error: 'Signed evidence export is a Team feature.',
      upgrade: process.env.PRICING_URL,
    })
  }

  const fullName = `${params.owner}/${params.repo}`
  const scans = await listScans(account!.id, fullName, 10_000)
  if (scans.length === 0) return json(res, 404, { error: 'no scans for this repository' })

  const reports: ScanReport[] = []
  for (const scan of scans) {
    const report = await getReport(account!.id, scan.id)
    if (report) reports.push(report)
  }

  const chain = scans.map((scan) => ({
    contentHash: scan.content_hash,
    prevHash: scan.prev_hash,
    chainHash: scan.chain_hash,
    scannedAt: new Date(scan.scanned_at).toISOString(),
  }))

  const manifest: ExportManifest = {
    schemaVersion: '1',
    tool: `${PRODUCT_NAME} ${scans[scans.length - 1]!.tool_version}`,
    repository: fullName,
    // The export's own timestamp is outside the signed chain and is the one
    // piece of it that is only as trustworthy as our clock.
    generatedAt: new Date().toISOString(),
    scanCount: scans.length,
    from: chain[0] ? { scannedAt: chain[0].scannedAt, contentHash: chain[0].contentHash } : null,
    to: chain[chain.length - 1]
      ? {
          scannedAt: chain[chain.length - 1]!.scannedAt,
          contentHash: chain[chain.length - 1]!.contentHash,
        }
      : null,
    chain,
    disclaimer: DISCLAIMER,
    coverageNote: AUTOMATED_COVERAGE_NOTE,
    verificationInstructions: VERIFICATION_INSTRUCTIONS,
  }

  const privateKey = process.env.EVIDENCE_PRIVATE_KEY
  if (!privateKey) return json(res, 503, { error: 'no signing key is configured' })

  const signature = signManifest(manifest, privateKey)
  const keyId = process.env.EVIDENCE_KEY_ID ?? 'unknown'

  await query(
    `insert into exports (account_id, repository_id, scan_count, manifest_hash, signature, key_id, format, created_by)
     select $1, r.id, $2, $3, $4, $5, 'json', $1 from repositories r
     where r.account_id = $1 and r.full_name = $6`,
    [
      account!.id,
      scans.length,
      `sha256:${createHash('sha256').update(canonicalize(manifest)).digest('hex')}`,
      signature,
      keyId,
      fullName,
    ],
  )

  const payload: SignedExport = {
    manifest,
    signature,
    keyId,
    keyUrl: `${process.env.PUBLIC_URL ?? ''}/.well-known/attest-signing-key.pem`,
    reports,
  }
  json(res, 200, payload)
})

/* ------------------------------- statement ------------------------------- */

route('POST', '/v1/repos/:owner/:repo/statement', 'either', async ({ res, account, params, body }) => {
  if (account!.plan !== 'team') {
    return json(res, 402, {
      error: 'Accessibility statement drafting is a Team feature.',
      upgrade: process.env.PRICING_URL,
    })
  }

  const input = (await body()) as {
    organisationName?: string
    serviceName?: string
    serviceUrl?: string
    feedbackEmail?: string
    feedbackUrl?: string
    enforcementBody?: { name: string; url: string }
    manualTesting?: { performedBy: string; date: string; scope: string }
  }

  for (const field of ['organisationName', 'serviceName', 'serviceUrl', 'feedbackEmail'] as const) {
    if (!input[field]) return json(res, 400, { error: `${field} is required` })
  }

  const scans = await listScans(account!.id, `${params.owner}/${params.repo}`, 100)
  const reports: ScanReport[] = []
  for (const scan of scans) {
    const report = await getReport(account!.id, scan.id)
    if (report) reports.push(report)
  }
  if (reports.length === 0) return json(res, 404, { error: 'no scans for this repository' })

  const statement = generateStatement({
    organisationName: input.organisationName!,
    serviceName: input.serviceName!,
    serviceUrl: input.serviceUrl!,
    feedbackEmail: input.feedbackEmail!,
    feedbackUrl: input.feedbackUrl,
    enforcementBody: input.enforcementBody,
    manualTesting: input.manualTesting,
    reports,
  })

  json(res, 200, { ...statement, attribution: ATTRIBUTION })
})

/* -------------------------------- account -------------------------------- */

route('DELETE', '/v1/account', 'session', async ({ res, account }) => {
  // Whole accounts only. There is no endpoint that deletes one scan: the chain
  // would break, and a broken chain is indistinguishable from tampering.
  await deleteAccount(account!.id)
  res.writeHead(204, { 'set-cookie': cookie('attest_session', '', { maxAge: 0 }) })
  res.end()
})

/* -------------------------------- billing -------------------------------- */

route('POST', '/webhooks/billing', 'none', async ({ req, res, body }) => {
  const raw = await readRaw(req)
  if (!verifyWebhookSignature(req.headers, raw)) {
    return json(res, 401, { error: 'invalid signature' })
  }
  await applyBillingEvent(JSON.parse(raw))
  json(res, 200, { ok: true })
  void body
})

/* --------------------------------- server -------------------------------- */

export function createApiServer() {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

    for (const candidate of routes) {
      if (candidate.method !== req.method) continue
      const match = candidate.pattern.exec(url.pathname)
      if (!match) continue

      const params: Record<string, string> = {}
      candidate.keys.forEach((key, index) => {
        params[key] = decodeURIComponent(match[index + 1] ?? '')
      })

      try {
        const account = await authenticate(req, candidate.auth)
        if (candidate.auth !== 'none' && !account) {
          return json(res, 401, { error: 'authentication required' })
        }
        await candidate.handler({
          req,
          res,
          url,
          params,
          account,
          body: async () => JSON.parse((await readRaw(req)) || '{}'),
        })
      } catch (error) {
        // Never leak an internal error's detail to a caller; log it and return
        // something a client can act on.
        console.error('[api]', error)
        if (!res.headersSent) json(res, 500, { error: 'internal error' })
      }
      return
    }

    json(res, 404, { error: 'not found' })
  })
}

async function authenticate(req: IncomingMessage, auth: Route['auth']): Promise<Account | undefined> {
  if (auth === 'none') return undefined

  const header = req.headers.authorization
  if ((auth === 'token' || auth === 'either') && header?.startsWith('Bearer ')) {
    const account = await accountForToken(header.slice(7).trim())
    if (account) return account
  }
  if (auth === 'session' || auth === 'either') {
    const session = readCookie(req, 'attest_session')
    if (session) return accountForSession(session)
  }
  return undefined
}

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'x-content-type-options': 'nosniff',
  })
  res.end(payload)
}

const MAX_BODY_BYTES = 8 * 1024 * 1024

const rawBodies = new WeakMap<IncomingMessage, Promise<string>>()

/** Memoised so a handler and the signature check read the same bytes. */
function readRaw(req: IncomingMessage): Promise<string> {
  let existing = rawBodies.get(req)
  if (!existing) {
    existing = new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = []
      let size = 0
      req.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > MAX_BODY_BYTES) {
          reject(new Error('request body too large'))
          req.destroy()
          return
        }
        chunks.push(chunk)
      })
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      req.on('error', reject)
    })
    rawBodies.set(req, existing)
  }
  return existing
}

function cookie(name: string, value: string, options: { maxAge: number }): string {
  return [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    process.env.NODE_ENV === 'production' ? 'Secure' : undefined,
    `Max-Age=${options.maxAge}`,
  ]
    .filter(Boolean)
    .join('; ')
}

function readCookie(req: IncomingMessage, name: string): string | undefined {
  const header = req.headers.cookie
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return undefined
}

if (process.env.NODE_ENV !== 'test' && process.argv[1]?.endsWith('server.js')) {
  const port = Number(process.env.PORT ?? 8080)
  createApiServer().listen(port, () => {
    console.log(`${PRODUCT_NAME} API listening on ${port}`)
  })
}
