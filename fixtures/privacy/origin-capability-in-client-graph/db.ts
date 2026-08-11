// A helper module that exports one browser-safe function and, in the same file,
// imports a Postgres driver. Importing the formatter drags the driver into the
// client bundle.
import { Pool } from 'pg'

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export function formatRow(row: string): string {
  return row.trim().toUpperCase()
}
