# `@attestci/rules-privacy`

Privacy, placement and client-cost rules for [Attest](https://attest.ci).
MIT licensed.

**This is the layer nothing else checks.**

## What it finds

- **`privacy/session-data-in-shared-cache`** — a `fetch` that sends a per-session
  credential *and* asks to be cached puts one visitor's response in the Next.js
  Data Cache, which is keyed by URL and shared across every visitor. It works
  perfectly in development, where there is one user.
- **`privacy/server-env-in-client-graph`** — an environment variable read in a
  module that reaches the browser, where it evaluates to `undefined`. The file
  usually has no `'use client'` in it: it became browser code by being imported.
- **`privacy/origin-capability-in-client-graph`** — a database driver, mail
  transport or Node builtin reachable from the client bundle, transitively.
- **`privacy/non-idempotent-retry`** — a POST under a retry wrapper with no
  idempotency key. A duplicate charge waiting for packet loss.
- **`privacy/async-work-outlives-request`** — work scheduled past the end of a
  request, which a serverless runtime may freeze before it completes.
- **`privacy/over-broad-cache-invalidation`**, **`privacy/public-env-secret`**,
  and one experimental rule.
- **`client/sequential-server-fetch`** and
  **`client/route-entry-is-client-component`** for delivery cost.

## Why a per-file linter cannot do this

`'use client'` marks a *boundary*, not a file. Everything a client module
imports also ships, however many hops away. So the file with the problem in it
is usually an ordinary helper with nothing wrong in it — its *position in the
import graph* is the problem, and that requires a whole-program view.

Type-only imports are excluded from that graph, because they are erased before
bundling. Getting that wrong reports every codebase with a shared types module as
leaking its database layer into the browser.

---

_Not legal advice._
