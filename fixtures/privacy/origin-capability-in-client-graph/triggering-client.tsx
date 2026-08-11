'use client'

// The client boundary. The database driver is two hops away, in db.ts.
import { formatRow } from './db'

export function RowList({ rows }: { rows: string[] }) {
  return (
    <ul>
      {rows.map((row) => (
        <li key={row}>{formatRow(row)}</li>
      ))}
    </ul>
  )
}
