#!/usr/bin/env node
/**
 * Applies SQL migrations in order, once each, inside a transaction.
 *
 * Deliberately about forty lines. A migration framework is a dependency, a
 * config file and a set of conventions to learn, and this needs to apply files
 * in lexical order and remember which it has applied.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const dir = fileURLToPath(new URL('../migrations', import.meta.url))
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(2)
}

const client = new pg.Client({ connectionString })
await client.connect()

await client.query(`
  create table if not exists schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`)

const applied = new Set(
  (await client.query('select name from schema_migrations')).rows.map((r) => r.name),
)

const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()
let count = 0

for (const file of files) {
  if (applied.has(file)) continue
  const sql = await readFile(join(dir, file), 'utf8')
  process.stdout.write(`applying ${file}… `)
  try {
    await client.query('begin')
    await client.query(sql)
    await client.query('insert into schema_migrations (name) values ($1)', [file])
    await client.query('commit')
    console.log('ok')
    count++
  } catch (error) {
    await client.query('rollback')
    console.log('failed')
    console.error(error.message)
    await client.end()
    process.exit(1)
  }
}

console.log(count === 0 ? 'nothing to apply' : `applied ${count} migration(s)`)
await client.end()
