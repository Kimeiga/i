# Progress

**Updated:** 2026-08-11

---

## Where this is

**Phases 0, 1 and 2 are built.** Phase 3 (hosted service) is scaffolded but not
deployed. Nothing is published to npm and nothing is running anywhere.

| Phase | Status |
| --- | --- |
| 0 — Foundation | **Done.** `pnpm check` green, `attest scan ./fixtures` reports |
| 1 — Local CLI | **Done.** 30 rules, all with fixtures. Gate met — see below |
| 2 — Action and distribution | **Built, not shipped.** Action and docs written; not published, 0 installs |
| 3 — Hosted service | **Scaffolded.** Schema, API and site written and tested; not deployed |
| 4 — Autofix | Not started. Blocked on Phase 3 revenue, by design |

### Phase 1 gate: met

> Run it against three real open-source Next.js repos and produce findings the
> founder agrees are real and non-obvious. If the findings are all things ESLint
> already catches, stop and reconsider the whole product.

Scanned `vercel/commerce`, `vercel/ai-chatbot` and `documenso/documenso` at pinned
commits. Write-ups in `gtm/public-scans/`, raw reports in
`gtm/public-scans/reports/`.

The finding that answers the gate question, from Next.js Commerce:

> `lib/utils.ts` has no `'use client'` directive. It reaches the browser because
> `components/cart/modal.tsx` imports `createUrl` from it. It reads
> `process.env.VERCEL_PROJECT_PRODUCTION_URL`, which is `undefined` in the client
> bundle, so `baseUrl` silently falls back to `http://localhost:3000` in every
> browser in production.

No ESLint rule finds that, because nothing about `lib/utils.ts` is wrong. Its
*position in the import graph* is. Same class of finding in `ai-chatbot`
(`IS_DEMO`, `PLAYWRIGHT_*`), plus two unawaited async operations in a route
handler and 25 avoidable round trips in `documenso`.

**The scans also earned their keep as a correctness harness.** They found two
false positives no fixture had caught, one of which — treating `<Input>` as
`<input>` — reported 106 phantom findings in one repository and would have made
the tool useless on any codebase with a design system. Both fixed, both with named
regression fixtures. See ADR-0017 and ADR-0018.

### Phase 2 gate: not met

> Action installed on 20+ repositories.

**0 installs.** Nothing has been published. This is the honest state.

---

## What exists

**30 rules**, each with code that must trigger it, code that must not, and a
generated docs page. CI fails if any of those is missing or stale.

- 14 runtime accessibility rules wrapping axe-core, tested against a real Chromium
- 6 static accessibility rules, no browser needed
- 8 privacy and placement rules
- 2 client-impact rules, plus startup-JS measurement from Next.js build manifests

**69 tests passing**, including the end-to-end suite that proves the diff is
semantic (ten lines added above a finding report zero new findings) and the
evidence suite that proves a broken hash chain names the record that broke it.

**Four CI gates**: build, claim check, tests, docs coverage.

**The hosted service**: append-only Postgres schema with the constraint enforced
by a database trigger, hash-chained records, Ed25519-signed exports verifiable
without an account, and an accessibility statement generator that refuses to state
a conformance level.

**The site**: landing page, docs rendered from the repository's own markdown, the
three public scan pages, and a dashboard. It passes its own scan with all four
layers running — 14 runtime rules over 4 rendered pages, zero findings — and CI
enforces that.

**All GTM deliverables written**: positioning, three real public scan pages, launch
drafts for five venues, four comparison pages, outreach templates, legal templates,
support system with eight canned responses.

---

## Next three tasks

In order. Each fits one 90-minute session.

### 1. Read the employment agreement — IP assignment and outside-work clauses

**Blocking everything.** `gtm/legal/founder-only-tasks.md`.

If the employer owns the IP, every hour after this one is wasted. It is a one-hour
read and, if the answer is ambiguous, a one-hour conversation with an employment
solicitor. Cheapest possible thing to check and it should have been first.

### 2. Claim the names

`@attestci` on npm and the GitHub organisation. Both were unclaimed on 2026-08-11
and both are free. `attest` itself is taken on npm (v1.0.1, 2016); the fallbacks
are `attestly` and `attest-ci`, both verified free the same day.

Then buy the domain. This is the first spend against the $2,000 cap.

### 3. Publish the packages and the Action, and install it on one repository

`@attestci/core`, `/rules-a11y`, `/rules-privacy`, `/cli` to npm; the Action to the
Marketplace as a free listing. Then install it on a repository the founder
controls and watch one real pull request comment appear.

Everything after that is downstream of a working install.

---

## Blockers

**The employment agreement.** Unknown until read. Everything else is downstream.

**Nothing is published.** The whole Phase 2 gate is unmeasurable until it is.

**The domain is a placeholder.** `attest.ci` appears in the code and docs and has
not been bought. It is one constant (`PRODUCT_URL`) and one search-and-replace, but
every published docs link is dead until then.

---

## Kill criteria

Written now, while it is cheap to be honest.

**Distribution.** If three published scan reports cannot produce **20 Action
installs within six weeks** of the third one going up, the distribution thesis is
wrong. The response is to say so plainly — here, and publicly — not to build more
features. Set the date when the third scan is published and hold it.

**Product.** If findings on real repositories turn out to be things ESLint already
catches, stop. **Currently passed**, on the evidence above.

**Revenue.** If Phase 3 ships and nobody who was not personally asked pays within
90 days, the willingness-to-pay thesis is wrong. Roughly 40% of micro-SaaS
products never reach $1,000 MRR; that is the base rate to plan against, not an
outlier to fear.

---

## Spend so far

**$0** against the $2,000 cap.

Everything so far is free: npm, GitHub, open-source dependencies. First spend will
be the domain, then the lawyer's review of the legal templates — which is the item
most worth the money.

---

## Things deliberately not built

Refusing these is a design decision, not a backlog. See §8 of the brief and
`gtm/positioning.md`.

Overlays or runtime fixes · SOC 2 · SAML/SSO/SCIM · custom contracts, redlined
MSAs, negotiated DPAs, security questionnaires · phone support, live chat, SLAs ·
frameworks other than React and Next.js · a component library · AI blog content ·
features requested by a single large prospect · free audits, POCs and pilots.

---

## Honest assessment

The engineering is in good shape and further along than the calendar suggests. The
rule set is real, the false-positive discipline is real and has already been
tested, and the architecture genuinely supports adding a rule in one evening.

**Distribution is untested and is the entire risk.** Roughly 17% of new
subscription products reach $1,000 MRR within two years. Building was never the
scarce input.

The single most valuable thing that has happened so far is not any of the code. It
is that running the scanner against three real repositories found two false
positives within an hour — one of them fatal to adoption — before a single user
ever saw it.
