import { Pool, type PoolClient, type QueryResultRow } from 'pg'
import { computeContentHash, type ScanReport } from '@attestci/core'
import { computeChainHash, verifyChain, type ChainLink } from './evidence.js'

/**
 * Data access.
 *
 * Every query is scoped by account id at this layer, not at the route layer.
 * A route that forgets a `where account_id = $1` is a cross-tenant data leak,
 * and this product's entire pitch is about not having those.
 */

let pool: Pool | undefined

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('DATABASE_URL is not set')
    pool = new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
    })
  }
  return pool
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params)
  return result.rows
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('begin')
    const result = await fn(client)
    await client.query('commit')
    return result
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

/* -------------------------------- accounts ------------------------------- */

export interface Account {
  id: string
  github_id: string
  github_login: string
  kind: 'user' | 'organization'
  email: string | null
  plan: 'free' | 'solo' | 'team'
  retention_days: number
}

export async function upsertAccount(input: {
  githubId: number
  login: string
  kind: 'user' | 'organization'
  email?: string
}): Promise<Account> {
  const rows = await query<Account>(
    `insert into accounts (github_id, github_login, kind, email)
     values ($1, $2, $3, $4)
     on conflict (github_id) do update
       set github_login = excluded.github_login,
           email        = coalesce(excluded.email, accounts.email),
           updated_at   = now()
     returning id, github_id, github_login, kind, email, plan, retention_days`,
    [input.githubId, input.login, input.kind, input.email ?? null],
  )
  return rows[0]!
}

/* ------------------------------ repositories ----------------------------- */

export async function ensureRepository(accountId: string, fullName: string): Promise<string> {
  const rows = await query<{ id: string }>(
    `insert into repositories (account_id, full_name)
     values ($1, $2)
     on conflict (account_id, full_name) do update set full_name = excluded.full_name
     returning id`,
    [accountId, fullName],
  )
  return rows[0]!.id
}

/* ---------------------------------- scans -------------------------------- */

export class IngestError extends Error {}

/**
 * Records a scan, linking it to the previous one for the same repository.
 *
 * Two checks happen before anything is written, and neither is negotiable:
 * the report's own content hash must match its contents, and the chain link is
 * computed from the current tail inside the same transaction. A report that
 * fails the first is either corrupted or edited, and storing it would put
 * something unverifiable in a store whose only purpose is being verifiable.
 */
export async function ingestScan(
  accountId: string,
  fullName: string,
  report: ScanReport,
): Promise<{ scanId: string; chainHash: string; duplicate: boolean }> {
  if (computeContentHash(report) !== report.contentHash) {
    throw new IngestError(
      'Report content hash does not match its contents. It was modified after it was produced, ' +
        'or written by a different tool version. Re-run the scan.',
    )
  }

  return transaction(async (client) => {
    const repo = await client.query<{ id: string }>(
      `insert into repositories (account_id, full_name)
       values ($1, $2)
       on conflict (account_id, full_name) do update set full_name = excluded.full_name
       returning id`,
      [accountId, fullName],
    )
    const repositoryId = repo.rows[0]!.id

    // `for update` on the tail row serialises concurrent ingests for the same
    // repository, which two CI jobs finishing at once will otherwise attempt.
    const tail = await client.query<{ chain_hash: string; content_hash: string }>(
      `select chain_hash, content_hash from scans
       where repository_id = $1
       order by id desc limit 1
       for update`,
      [repositoryId],
    )
    const prev = tail.rows[0]

    // An identical report re-sent (a retried CI job) is not a new link in the
    // chain. Returning the existing record is the honest response.
    if (prev && prev.content_hash === report.contentHash) {
      const existing = await client.query<{ id: string; chain_hash: string }>(
        `select id, chain_hash from scans where repository_id = $1 order by id desc limit 1`,
        [repositoryId],
      )
      return { scanId: existing.rows[0]!.id, chainHash: existing.rows[0]!.chain_hash, duplicate: true }
    }

    const prevHash = prev?.chain_hash ?? null
    const scannedAt = report.scan.startedAt
    const chainHash = computeChainHash(prevHash, report.contentHash, scannedAt)

    const counts = countBySeverity(report)
    const inserted = await client.query<{ id: string }>(
      `insert into scans (
         repository_id, scan_uuid, tool_version, commit_sha, ref,
         content_hash, prev_hash, chain_hash, report,
         finding_count, critical_count, serious_count, moderate_count, minor_count,
         suppressed_count, layers_ran, layers_skipped, scanned_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       returning id`,
      [
        repositoryId,
        report.scan.id,
        report.tool.version,
        report.target.commit ?? null,
        report.target.ref ?? null,
        report.contentHash,
        prevHash,
        chainHash,
        JSON.stringify(report),
        report.findings.length,
        counts.critical,
        counts.serious,
        counts.moderate,
        counts.minor,
        report.suppressed.length,
        report.coverage.layers.filter((l) => l.ran).map((l) => l.kind),
        report.coverage.layers.filter((l) => !l.ran).map((l) => l.kind),
        scannedAt,
      ],
    )
    const scanId = inserted.rows[0]!.id

    for (const finding of report.findings) {
      await client.query(
        `insert into scan_findings (scan_id, rule_id, kind, severity, fingerprint, surface, file_path, line)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (scan_id, fingerprint) do nothing`,
        [
          scanId,
          finding.ruleId,
          finding.kind,
          finding.severity,
          finding.fingerprint,
          finding.surface,
          finding.location.kind === 'source' ? finding.location.file : null,
          finding.location.kind === 'source' ? finding.location.line : null,
        ],
      )
    }

    return { scanId, chainHash, duplicate: false }
  })
}

function countBySeverity(report: ScanReport) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 }
  for (const finding of report.findings) counts[finding.severity]++
  return counts
}

export interface ScanRow {
  id: string
  content_hash: string
  prev_hash: string | null
  chain_hash: string
  commit_sha: string | null
  ref: string | null
  finding_count: number
  critical_count: number
  serious_count: number
  moderate_count: number
  minor_count: number
  suppressed_count: number
  layers_ran: string[]
  layers_skipped: string[]
  scanned_at: string
  tool_version: string
}

export async function listScans(
  accountId: string,
  fullName: string,
  limit = 100,
): Promise<ScanRow[]> {
  return query<ScanRow>(
    `select s.id, s.content_hash, s.prev_hash, s.chain_hash, s.commit_sha, s.ref,
            s.finding_count, s.critical_count, s.serious_count, s.moderate_count,
            s.minor_count, s.suppressed_count, s.layers_ran, s.layers_skipped,
            s.scanned_at, s.tool_version
     from scans s
     join repositories r on r.id = s.repository_id
     where r.account_id = $1 and r.full_name = $2
     order by s.id asc
     limit $3`,
    [accountId, fullName, limit],
  )
}

export async function getReport(accountId: string, scanId: string): Promise<ScanReport | undefined> {
  const rows = await query<{ report: ScanReport }>(
    `select s.report from scans s
     join repositories r on r.id = s.repository_id
     where r.account_id = $1 and s.id = $2`,
    [accountId, scanId],
  )
  return rows[0]?.report
}

/** Walks the stored chain for a repository and reports where it breaks. */
export async function verifyRepositoryChain(accountId: string, fullName: string) {
  const rows = await listScans(accountId, fullName, 10_000)
  const links: ChainLink[] = rows.map((row) => ({
    contentHash: row.content_hash,
    prevHash: row.prev_hash,
    chainHash: row.chain_hash,
    scannedAt: new Date(row.scanned_at).toISOString(),
  }))
  return { ...verifyChain(links), length: links.length }
}

/**
 * Deletes an entire account. There is no path that deletes one scan: the chain
 * would break, and a broken chain is indistinguishable from tampering.
 */
export async function deleteAccount(accountId: string): Promise<void> {
  await query('select delete_account($1)', [accountId])
}
