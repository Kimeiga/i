## Why it matters

A retry wrapper around a POST is a duplicate charge waiting for packet loss. The origin processes
the request, the response is lost in transit, the wrapper cannot tell the difference between that
and a request that never arrived, and it sends it again.

It never reproduces locally, it appears only under network conditions you cannot make happen on
purpose, and it is diagnosed months later from a support ticket about being billed twice.

Stripe, Adyen, and most payment APIs support idempotency keys precisely because this is the default
outcome otherwise.

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

## What this rule will not catch

It looks for a `fetch` with an unsafe method lexically inside a call to a function with a
retry-shaped name. A retry implemented as a decorator, configured on an HTTP client instance, or
provided by your infrastructure — a queue with automatic redelivery, a proxy that retries on 5xx —
is invisible here. Those are the same hazard and worth auditing by hand.
