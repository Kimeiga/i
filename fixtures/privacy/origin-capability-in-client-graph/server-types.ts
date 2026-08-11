// Imports a database driver AND is imported by a client component — but only
// with `import type`, which is erased before bundling. Nothing here reaches the
// browser, so nothing here may be reported.
//
// This fixture exists because the first run against a real repository reported
// exactly this shape as a critical finding. It is the pattern every
// well-organised TypeScript codebase uses.
import type { QueryResult } from 'pg'

export interface CustomerRow {
  id: string
  email: string
}

export type CustomerQueryResult = QueryResult<CustomerRow>
