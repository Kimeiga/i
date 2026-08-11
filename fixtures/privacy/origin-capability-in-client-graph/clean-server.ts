// Same imports, but nothing client-side reaches this module, so it is correct.
import { readFile } from 'node:fs/promises'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function loadSchema(): Promise<string> {
  return readFile('./schema.sql', 'utf8')
}

export async function countUsers(): Promise<number> {
  const result = await pool.query('select count(*) from users')
  return Number(result.rows[0].count)
}
