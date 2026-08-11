## Why it matters

Each `await` on an independent request costs a full round trip, and the page cannot begin rendering
until all of them have returned. Two 200ms calls in sequence are 400ms of time-to-first-byte; the
same two started together are 200ms.

It is invisible in a diff. The second `await` looks exactly like the first, and nothing about the
code says the calls do not depend on each other — which is why this is worth a machine noticing.

## How to fix it

Start both before awaiting either:

```ts
const [profile, flags] = await Promise.all([getProfile(userId), getFeatureFlags()])
```

If one genuinely needs the other's result, the sequence is correct and there is no finding — the
rule checks for that before reporting.

## What this rule will not catch

Adjacent statements inside one function, where the awaited expression looks like data fetching. A
waterfall spread across a component tree — parent awaits, renders a child, child awaits — is the
more common and more expensive version, and this rule does not see it. Nor does it see one created
by a hook or a data-loading library. Suspense boundaries and the React DevTools profiler are the
tools for that.
