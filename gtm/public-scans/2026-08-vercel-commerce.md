# Scanning Next.js Commerce

**Project:** [vercel/commerce](https://github.com/vercel/commerce) — the official
Next.js Commerce template
**Commit:** `3761e52e60df9c6a316e067dbfd7032e494d3634`
**Scanned:** 11 August 2026 with Attest 0.1.0
**Report:** [JSON](reports/commerce.json) · [Markdown](reports/commerce.md) ·
`sha256:b1b8c3b98a1b3622…`
**Findings:** 8, across 66 source files

---

Next.js Commerce is the reference implementation a lot of teams copy when they
start a storefront. That makes it a good thing to scan carefully: whatever is in
here is in a lot of other codebases too.

It is a genuinely well-built template. Server Components are used where they
belong, the client boundary is drawn tightly, and the whole thing is small enough
to read. The scan found eight things across 66 files, which is a low number.

**This scan was source-only.** No runtime accessibility checks ran, because we
did not stand the application up against a Shopify store. axe-core evaluates a
rendered DOM and there was no rendered DOM here, so nothing in this page says
anything about colour contrast, computed accessible names, or anything else that
requires the page to exist. The report records that layer as *did not run*.

---

## The one worth reading

### An environment variable that is `undefined` in the browser

**`lib/utils.ts:3`** — `privacy/server-env-in-client-graph`, serious

```ts
export const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000'
```

There is no `'use client'` in `lib/utils.ts`. It reaches the browser because
`components/cart/modal.tsx` — which does have one — imports `createUrl` from it:

```
components/cart/modal.tsx → lib/utils.ts
```

`VERCEL_PROJECT_PRODUCTION_URL` is not prefixed `NEXT_PUBLIC_`, so in the client
bundle that expression is replaced with `undefined`. The ternary takes the false
branch, and **`baseUrl` is `'http://localhost:3000'` in every browser, in
production.**

Nothing errors. The module evaluates fine. It is simply the wrong value,
everywhere, forever, in the half of the application that runs in a browser.

This is the finding that made us build the client import graph, and it is worth
being precise about why nothing else catches it. `lib/utils.ts` is a perfectly
ordinary module — a per-file linter looking at it sees nothing wrong, because
nothing in it *is* wrong. It became browser code by being imported, and the
import that did it is in a different file that a per-file linter also sees nothing
wrong with.

Whether it is a live bug depends on whether anything in the client bundle reads
`baseUrl`. In this codebase the main consumer is metadata generation on the
server. So: real, currently benign, and a trap for the next person who imports it
into a client component.

The same file reads `SHOPIFY_STORE_DOMAIN` twice inside a validation function
(lines 44–45), which is the same shape with the same caveat.

**Fix:** move the environment reads into a server-only module, or split
`createUrl` — a pure function with no environment dependency — into its own file
so client code stops pulling the rest of `utils.ts` along with it.

---

## The other six

Two accessibility findings we would raise in review:

- **`components/layout/navbar/search.tsx:15`** — the search input has no `id` and
  no accessible name. Its placeholder reads "Search for products...", and a
  placeholder is not a label: it disappears the moment the field has a value.
  Worth noting that **axe does not report this** — the placeholder does supply an
  accessible name under the accessible-name computation, so the markup is valid.
  We report it anyway as a WCAG 3.3.2 concern, and say so on
  [the rule page](../../docs/rules/a11y-label-association.md).
- **`components/layout/search/filter/dropdown.tsx:41`** — a `<div>` with an
  `onClick` and no key handling. Keyboard and switch users cannot open the filter
  dropdown at all.

Plus four more instances of the two patterns above in the same files.

---

## What we got wrong

Nothing in this scan, but the same scanning session against two other projects
found two false positives in our own rules, both fixed before these numbers were
published:

1. The client import graph followed **type-only imports**, which are erased before
   bundling. That reported a `lib/types.ts` doing `import type { … }` as dragging
   a database layer into the browser — a critical-severity finding on correct
   code.
2. Tag matching was **case-insensitive**, so `<Input>` — a design-system wrapper
   that sets its own id — was treated as the DOM element `<input>`.

Both now have named regression fixtures. If you find another, please open an
issue; we would rather hear it from you than not hear it.

---

## Upstream

**Not yet filed.** The `baseUrl` finding is the one worth a patch — splitting the
environment-dependent constants out of `lib/utils.ts` is a small, self-contained
change. Filing is a founder decision, not an automated one.

---

## Reproducing this

```bash
git clone --depth 1 https://github.com/vercel/commerce.git
cd commerce && git checkout 3761e52
npx @attestci/cli@0.1.0 scan . --fail-on never --json report.json
```

Same code, same tool version, same content hash. That is the point of the hash.

---

_Attest reports the results of automated checks. Automated testing detects only a
subset of accessibility barriers, and this scan did not render a single page.
Nothing here is a conformance claim about vercel/commerce, and nothing here is
legal advice. Runtime accessibility detection, where it runs, is performed by
[axe-core](https://github.com/dequelabs/axe-core), maintained by Deque Systems._
