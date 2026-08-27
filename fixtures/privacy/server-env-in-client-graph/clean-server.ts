// Reads the same kind of variable, but nothing in the client graph imports it,
// so it stays on the server where the value exists.

export const databaseUrl = process.env.DATABASE_URL
export const internalApiUrl = process.env.INTERNAL_API_URL

export function isProduction(): boolean {
  // NODE_ENV is defined in client bundles by every bundler, so reading it in
  // browser-bound code is correct and must not be reported.
  return process.env.NODE_ENV === 'production'
}
