import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { query, upsertAccount, type Account } from './db.js'

/**
 * GitHub OAuth for people, hashed bearer tokens for CI.
 *
 * No passwords, no magic links, no SAML. The buyer is already on GitHub, we
 * need repository identity anyway, and every additional method is an
 * account-recovery support burden a one-person business cannot carry.
 */

const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token'
const GITHUB_API = 'https://api.github.com'

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: required('GITHUB_CLIENT_ID'),
    redirect_uri: required('GITHUB_REDIRECT_URI'),
    // read:user for identity, read:org to resolve organisation membership.
    // Deliberately no repo scope: we never read source, only receive reports.
    scope: 'read:user user:email read:org',
    state,
  })
  return `${GITHUB_AUTHORIZE}?${params}`
}

export interface GithubUser {
  id: number
  login: string
  email: string | null
}

export async function exchangeCode(code: string): Promise<GithubUser> {
  const response = await fetch(GITHUB_TOKEN, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: required('GITHUB_CLIENT_ID'),
      client_secret: required('GITHUB_CLIENT_SECRET'),
      code,
      redirect_uri: required('GITHUB_REDIRECT_URI'),
    }),
  })
  if (!response.ok) throw new Error(`GitHub token exchange failed: ${response.status}`)
  const body = (await response.json()) as { access_token?: string; error_description?: string }
  if (!body.access_token) throw new Error(body.error_description ?? 'GitHub returned no access token')

  const user = await fetch(`${GITHUB_API}/user`, {
    headers: {
      authorization: `Bearer ${body.access_token}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'attest-api',
    },
  })
  if (!user.ok) throw new Error(`GitHub user lookup failed: ${user.status}`)
  const profile = (await user.json()) as { id: number; login: string; email: string | null }
  return { id: profile.id, login: profile.login, email: profile.email }
}

/* -------------------------------- sessions ------------------------------- */

const SESSION_DAYS = 30

export async function createSession(user: GithubUser): Promise<{ id: string; account: Account }> {
  const account = await upsertAccount({
    githubId: user.id,
    login: user.login,
    kind: 'user',
    email: user.email ?? undefined,
  })
  const id = randomBytes(32).toString('base64url')
  await query(
    `insert into sessions (id, account_id, expires_at)
     values ($1, $2, now() + make_interval(days => $3))`,
    [id, account.id, SESSION_DAYS],
  )
  return { id, account }
}

export async function accountForSession(sessionId: string): Promise<Account | undefined> {
  const rows = await query<Account>(
    `select a.id, a.github_id, a.github_login, a.kind, a.email, a.plan, a.retention_days
     from sessions s join accounts a on a.id = s.account_id
     where s.id = $1 and s.expires_at > now()`,
    [sessionId],
  )
  return rows[0]
}

export async function destroySession(sessionId: string): Promise<void> {
  await query('delete from sessions where id = $1', [sessionId])
}

/* --------------------------------- tokens -------------------------------- */

/**
 * Tokens are stored as SHA-256 digests, never in plaintext. A database dump
 * must not be a set of working credentials, and a support request asking us to
 * "read back" a token must have no possible answer.
 */
export async function createApiToken(accountId: string, name: string): Promise<string> {
  const secret = randomBytes(32).toString('base64url')
  const token = `attest_${secret}`
  await query(
    `insert into api_tokens (account_id, name, token_hash, prefix) values ($1, $2, $3, $4)`,
    [accountId, name, hashToken(token), token.slice(0, 15)],
  )
  return token
}

export async function accountForToken(token: string): Promise<Account | undefined> {
  if (!token.startsWith('attest_')) return undefined
  const rows = await query<Account & { token_id: string }>(
    `select a.id, a.github_id, a.github_login, a.kind, a.email, a.plan, a.retention_days,
            t.id as token_id
     from api_tokens t join accounts a on a.id = t.account_id
     where t.token_hash = $1 and t.revoked_at is null`,
    [hashToken(token)],
  )
  const row = rows[0]
  if (!row) return undefined
  // Fire and forget: a failed timestamp update must not fail an ingest.
  void query('update api_tokens set last_used_at = now() where id = $1', [row.token_id]).catch(
    () => {},
  )
  return row
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

/** Constant-time comparison for webhook signatures and CSRF state. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function randomState(): string {
  return randomBytes(16).toString('base64url')
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}
