// Nothing in this file says "use client". It reaches the browser because
// triggering-client.tsx imports it, which is exactly why a per-file linter
// cannot see the problem.

export const apiBaseUrl = process.env.INTERNAL_API_URL ?? 'https://api.example.com'

export const featureFlags = {
  // Evaluates to undefined in the browser, so this is permanently false there.
  showAdvanced: process.env.ENABLE_ADVANCED_SEARCH === 'true',
}
