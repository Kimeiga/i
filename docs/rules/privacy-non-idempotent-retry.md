# `privacy/non-idempotent-retry`

> Non-idempotent request under automatic retry

| | |
| --- | --- |
| Severity | serious |
| Layer | Privacy and placement (source analysis) |
| Status | enabled by default |

## What it detects

A POST, PATCH or DELETE is issued inside a retry wrapper without an idempotency key. When the origin processes the request but the response is lost, the retry repeats the effect: a duplicate charge, a duplicate order, a second email. This only happens under network failure, so it does not appear in testing.

## Why it matters

A retry wrapper around a POST is a duplicate charge waiting for packet loss. The origin processes
the request, the response is lost in transit, the wrapper cannot tell the difference between that
and a request that never arrived, and it sends it again.

It never reproduces locally, it appears only under network conditions you cannot make happen on
purpose, and it is diagnosed months later from a support ticket about being billed twice.

Stripe, Adyen, and most payment APIs support idempotency keys precisely because this is the default
outcome otherwise.

## Standards

| Framework | Reference | |
| --- | --- | --- |
| Attest property | retry-safety | Operations under automatic retry are idempotent |

`privacy-property` means this is our own definition, not a numbered requirement in a published standard. We label it that way rather than citing a regulation that does not say it.

## Code that triggers it

`fixtures/privacy/non-idempotent-retry/triggering.ts`

```ts
import retry from 'p-retry'

// A retry around a charge. The origin can process the request and lose the
// response, in which case this bills the customer twice.
export async function charge(amountCents: number, customerId: string) {
  return retry(async () => {
    const response = await fetch('https://api.payments.example.com/v1/charges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents, customerId }),
    })
    if (!response.ok) throw new Error('charge failed')
    return response.json()
  })
}

export async function cancelSubscription(id: string) {
  return retry(async () => {
    const response = await fetch(`https://api.billing.example.com/v1/subscriptions/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error('cancel failed')
    return response.json()
  })
}
```

## Code that does not

`fixtures/privacy/non-idempotent-retry/clean.ts`

```ts
import { randomUUID } from 'node:crypto'
import retry from 'p-retry'

// The key is generated once, outside the retry, so every attempt carries the
// same key and the origin can collapse duplicates.
export async function charge(amountCents: number, customerId: string) {
  const idempotencyKey = randomUUID()
  return retry(async () => {
    const response = await fetch('https://api.payments.example.com/v1/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ amountCents, customerId }),
    })
    if (!response.ok) throw new Error('charge failed')
    return response.json()
  })
}

// Reads are safe to repeat.
export async function loadInvoice(id: string) {
  return retry(async () => {
    const response = await fetch(`https://api.billing.example.com/v1/invoices/${id}`, {
      method: 'GET',
    })
    return response.json()
  })
}

// A POST with no retry around it.
export async function submitFeedback(body: string) {
  const response = await fetch('https://api.example.com/v1/feedback', {
    method: 'POST',
    body,
  })
  return response.ok
}
```

## How to fix it

Generate an idempotency key **once, outside the retry loop**, and send it on every attempt. A key
generated inside the callback is a new key each time and does nothing:

```ts
const key = randomUUID()               // outside
return retry(() =>
  fetch(url, { method: 'POST', headers: { 'Idempotency-Key': key } }),  // same key every attempt
)
```

If the endpoint has no idempotency support, move the retry to a step that is safe to repeat, or drop
it and surface the failure.

## How to suppress it

```ts
// attest-disable-next-line privacy/non-idempotent-retry -- why this instance is intentional
```

Or for a whole file:

```ts
// attest-disable-file privacy/non-idempotent-retry -- why this file is intentional
```

Or in `attest.config.json`, to turn the rule off everywhere:

```json
{
  "rules": {
    "privacy/non-idempotent-retry": "off"
  }
}
```

Suppressed findings are **recorded in the report**, with the reason you gave. That is deliberate: a suppression is a decision, and the evidence trail keeps decisions. It is not a way to make a finding disappear from the record.

---

_Automated tooling can evaluate roughly a quarter to a third of WCAG 2.1 success criteria. The rest — meaningful alt text, logical reading order, usable focus management, comprehensible error recovery — requires human judgement. Attest does not attempt them and does not report on them._

_Attest reports the results of automated checks. Automated testing detects only a subset of accessibility barriers. A clean Attest run is not a conformance claim, a legal opinion, or a substitute for testing with assistive technology and with disabled users. This is not legal advice._

<!-- Generated by scripts/generate-rule-docs.mjs. Edit docs/rules/notes/ instead. -->
