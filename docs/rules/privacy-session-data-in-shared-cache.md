# `privacy/session-data-in-shared-cache`

> Session-scoped response stored in a shared cache

| | |
| --- | --- |
| Severity | critical |
| Layer | Privacy and placement (source analysis) |
| Status | enabled by default |

## What it detects

A fetch that sends a per-session credential and also carries a caching directive stores its response in the Next.js Data Cache, which is shared across all visitors and keyed by URL and request options rather than by user. The next visitor to request the same URL can be served the first visitor's data. This fails silently in development, where there is only one user.

## Why it matters

The Next.js Data Cache is keyed by the request URL and its options. It is not keyed by user. A
response fetched with one visitor's bearer token and stored there is served to the next visitor
who triggers the same URL.

This is the failure mode that produces the incident report titled "customers saw each other's
orders". It cannot be reproduced in development, where there is one user, one token, and a cache
that is usually disabled. It survives code review because both halves look correct in isolation:
sending a credential is right, and caching a slow request is right.

Under the GDPR this is an unauthorised disclosure of personal data, and Article 33 gives you 72
hours to notify a supervisory authority once you become aware of it. The relevant word is *aware*.
A tool that reports the condition, dated and hashed, is materially better placed than one that
does not — which is the point of the evidence trail rather than the finding. This is not legal
advice; see [Article 33](https://gdpr-info.eu/art-33-gdpr/) for the primary text.

## Standards

| Framework | Reference | |
| --- | --- | --- |
| Attest property | session-scope-isolation | Session-scoped data stays in session-scoped storage |

`privacy-property` means this is our own definition, not a numbered requirement in a published standard. We label it that way rather than citing a regulation that does not say it.

## Code that triggers it

`fixtures/privacy/session-data-in-shared-cache/triggering.ts`

```ts
// Each of these fetches sends a per-session credential AND asks to be cached,
// which puts one visitor's response in a cache the next visitor reads from.

export async function loadCustomerProfile(token: string) {
  const response = await fetch('https://api.example.com/v2/customer_profile', {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  })
  return response.json()
}

export async function loadEntitlements(token: string) {
  const response = await fetch('https://api.example.com/v2/entitlements', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'force-cache',
  })
  return response.json()
}

export async function loadCart() {
  const response = await fetch('https://api.example.com/v2/cart', {
    credentials: 'include',
    next: { tags: ['cart'] },
  })
  return response.json()
}
```

## Code that does not

`fixtures/privacy/session-data-in-shared-cache/clean.ts`

```ts
// None of these should be reported.

// Credentialled but explicitly not cached.
export async function loadCustomerProfile(token: string) {
  const response = await fetch('https://api.example.com/v2/customer_profile', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  return response.json()
}

// Credentialled, and revalidate: 0 opts out of the Data Cache.
export async function loadEntitlements(token: string) {
  const response = await fetch('https://api.example.com/v2/entitlements', {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  })
  return response.json()
}

// Cached, but the response is the same for everyone.
export async function loadProductCatalogue() {
  const response = await fetch('https://api.example.com/v2/products', {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })
  return response.json()
}

// Credentialled with no caching directive at all.
export async function loadInvoices(token: string) {
  const response = await fetch('https://api.example.com/v2/invoices', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.json()
}
```

## How to fix it

Pick one of three, in order of preference.

**Do not cache the credentialled request.** `cache: 'no-store'`, or `next: { revalidate: 0 }`. If
the response is per-user, the shared cache is the wrong place for it and no configuration makes it
right.

**Split the request.** Most endpoints that need a token return a mix: a shared catalogue plus a
per-user entitlement flag. Fetch the shared part without the credential and cache it; fetch the
small per-user part uncached.

**Cache per user deliberately, in a store you control.** A cache keyed by user id in Redis is fine.
The Data Cache is not that, and cannot be made into it.

## How to suppress it

```ts
// attest-disable-next-line privacy/session-data-in-shared-cache -- why this instance is intentional
```

Or for a whole file:

```ts
// attest-disable-file privacy/session-data-in-shared-cache -- why this file is intentional
```

Or in `attest.config.json`, to turn the rule off everywhere:

```json
{
  "rules": {
    "privacy/session-data-in-shared-cache": "off"
  }
}
```

Suppressed findings are **recorded in the report**, with the reason you gave. That is deliberate: a suppression is a decision, and the evidence trail keeps decisions. It is not a way to make a finding disappear from the record.

---

_Automated tooling can evaluate roughly a quarter to a third of WCAG 2.1 success criteria. The rest — meaningful alt text, logical reading order, usable focus management, comprehensible error recovery — requires human judgement. Attest does not attempt them and does not report on them._

_Attest reports the results of automated checks. Automated testing detects only a subset of accessibility barriers. A clean Attest run is not a conformance claim, a legal opinion, or a substitute for testing with assistive technology and with disabled users. This is not legal advice._

<!-- Generated by scripts/generate-rule-docs.mjs. Edit docs/rules/notes/ instead. -->
