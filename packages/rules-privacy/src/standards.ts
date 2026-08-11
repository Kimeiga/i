import type { StandardRef } from '@attestci/core'

/**
 * The privacy properties this pack checks.
 *
 * These are our definitions, and they are labelled as ours. No published
 * standard enumerates "session-scoped data must not enter a shared cache" as a
 * numbered requirement, and dressing our checks up as GDPR article references
 * would be the same category of dishonesty as claiming a scan makes you
 * compliant. Each property does explain which regulation makes it matter, in
 * the docs page, with a link to the primary source.
 */
export const PROPERTIES = {
  sessionScopeIsolation: {
    framework: 'privacy-property',
    id: 'session-scope-isolation',
    title: 'Session-scoped data stays in session-scoped storage',
  },
  originConfinement: {
    framework: 'privacy-property',
    id: 'origin-confinement',
    title: 'Server-only values and capabilities stay on the server',
  },
  retrySafety: {
    framework: 'privacy-property',
    id: 'retry-safety',
    title: 'Operations under automatic retry are idempotent',
  },
  requestLifetime: {
    framework: 'privacy-property',
    id: 'request-lifetime',
    title: 'Asynchronous work does not outlive the request that started it',
  },
  invalidationScope: {
    framework: 'privacy-property',
    id: 'invalidation-scope',
    title: 'Cache invalidation is no broader than the data that changed',
  },
  deliveryCost: {
    framework: 'privacy-property',
    id: 'delivery-cost',
    title: 'Client cost is intentional and visible in review',
  },
} as const satisfies Record<string, StandardRef>
