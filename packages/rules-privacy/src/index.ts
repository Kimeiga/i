import type { Rule, RulePack, ScanInput } from '@attestci/core'
import { createStaticContext, type StaticContext } from '@attestci/core/static'

import sessionDataInSharedCache from './rules/session-data-in-shared-cache.js'
import publicEnvSecret from './rules/public-env-secret.js'
import serverEnvInClientGraph from './rules/server-env-in-client-graph.js'
import originCapabilityInClientGraph from './rules/origin-capability-in-client-graph.js'
import nonIdempotentRetry from './rules/non-idempotent-retry.js'
import asyncWorkOutlivesRequest from './rules/async-work-outlives-request.js'
import overBroadCacheInvalidation from './rules/over-broad-cache-invalidation.js'
import overSerializedClientProps from './rules/over-serialized-client-props.js'
import sequentialServerFetch from './rules/sequential-server-fetch.js'
import routeEntryIsClientComponent from './rules/route-entry-is-client-component.js'

/**
 * The manifest.
 *
 * Adding a rule is: write the module, add one import and one array entry here,
 * add its fixtures, add its docs page. Nothing in the engine changes, and the
 * fixture and docs tests fail until the last two are done — which is how a rule
 * that ships in one session still ships complete.
 */
export const privacyRules: ReadonlyArray<Rule<StaticContext>> = [
  sessionDataInSharedCache,
  publicEnvSecret,
  serverEnvInClientGraph,
  originCapabilityInClientGraph,
  nonIdempotentRetry,
  asyncWorkOutlivesRequest,
  overBroadCacheInvalidation,
  overSerializedClientProps,
]

export const clientImpactRules: ReadonlyArray<Rule<StaticContext>> = [
  sequentialServerFetch,
  routeEntryIsClientComponent,
]

export const privacyPack: RulePack<StaticContext> = {
  id: 'privacy',
  kind: 'static-privacy',
  rules: privacyRules,
  createContext: (input: ScanInput) => createStaticContext(input),
}

export const clientImpactPack: RulePack<StaticContext> = {
  id: 'client-impact',
  kind: 'client-impact',
  rules: clientImpactRules,
  createContext: (input: ScanInput) => createStaticContext(input),
}

export const packs = [privacyPack, clientImpactPack] as const
export const allRules = [...privacyRules, ...clientImpactRules]
