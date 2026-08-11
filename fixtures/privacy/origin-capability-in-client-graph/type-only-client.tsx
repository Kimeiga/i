'use client'

// A client component that imports a type from a module which imports a database
// driver. The import is erased at compile time, so the driver never ships and
// there is nothing to report.
import type { CustomerRow } from './server-types'

export function CustomerName({ customer }: { customer: CustomerRow }) {
  return <span>{customer.email}</span>
}
