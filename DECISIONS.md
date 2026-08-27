# Architecture decision log

Append-only. Never edit an entry; supersede it with a new one and link back.

Each entry records what was decided, what it cost, and what would make it wrong —
so that a future reader (including a buyer taking this over) can tell a considered
decision from an accident.

---

## ADR-0001 — The product name is one constant

**Date:** 2026-08-11 · **Status:** accepted

`PRODUCT_NAME` lives in `packages/core/src/product.ts` and nothing else hardcodes
it. Renaming the product is a one-file change.

**Why:** `attest` is **taken on npm** (v1.0.1, published 2016), so the name may
have to change. Checked 2026-08-11: `@attestci/*` and `attest-ci` were unclaimed;
`attestly` was unclaimed; `conformly` and `vouchsafe` are taken.

**Decision:** product name **Attest**, npm scope **`@attestci`**, CLI binary
`attest`. Bin names do not need to be unique on npm and the 2016 package is a
single-version orphan, so PATH collision risk is negligible.

**Alternatives if the name has to change:** `attestly` (verified free on npm),
`attest-ci` (verified free), or a scoped-only identity.

**Would make this wrong:** the scope being claimed by someone else before launch.
Claim it early — it is free.

---

## ADR-0002 — Claim discipline is enforced in CI, not by convention

**Date:** 2026-08-11 · **Status:** accepted

`FORBIDDEN_CLAIM_PATTERNS` in `product.ts`, checked over `docs/`, `gtm/`,
`apps/web/` and the READMEs by `scripts/check-forbidden-words.mjs`, failing the
build.

**Why:** in January 2025 the FTC ordered accessiBe to pay $1,000,000 over claims
that its AI could make websites conform to WCAG 2.1 AA. A solo founder with no
lawyer cannot afford to discover in a deposition that a landing page said
something that read better at 11pm.

**Cost:** occasional false positives on legitimate sentences — quoting the FTC
complaint, or denying a certification. Handled with an explicit `claims-ok:`
marker requiring a written reason.

**Rejected:** teaching the regex to recognise negation. A regex that understands
"not" well enough to be trusted with a legal control does not exist, and a control
that silently permits a class of sentence is not a control.

---

## ADR-0003 — Coverage is stated as a range, and unverifiable figures are marked

**Date:** 2026-08-11 · **Status:** accepted

"Roughly a quarter to a third of WCAG 2.1 success criteria", never a precise
percentage.

**Why:** published estimates vary by methodology and by which criteria are
counted, and we have not run our own study. A number we cannot defend is worse
than a range we can.

Four figures from the original brief are marked `[UNVERIFIED]` in
`docs/regulatory-context.md` and are used nowhere: EU e-commerce pass rates,
enterprise platform pricing, churn benchmarks by category, and any minimum
install count for a paid GitHub Marketplace listing.

Verified and used: the EAA application date, EN 301 549 v3.2.1 as the current
harmonised standard, the Carrefour ruling, the Norwegian daily fine, the
Ireland/Sweden penalty range (secondary sources, labelled as such), and the FTC
accessiBe order (primary source).

---

## ADR-0004 — A rule is a plain object; adding one never touches the engine

**Date:** 2026-08-11 · **Status:** accepted

Static metadata plus a `check` function. Registered by one import and one array
entry. No lifecycle hooks, no registration side effects, no engine coupling.

**Why:** the schedule constraint made architectural. The founder has 90-minute
evening blocks. A rule must be writable, testable, documented and shippable in
one of them. If the interface stops allowing that, the interface is wrong and gets
redesigned — not the schedule.

**Consequence:** contexts are built by packs, not by the engine, so `core` never
learns about ts-morph, Playwright or axe-core.

---

## ADR-0005 — Fingerprints exclude line and column

**Date:** 2026-08-11 · **Status:** accepted

`sha256(ruleId + file + normalisedEvidence + occurrenceIndex)`.

**Why:** this is the product's central claim. If fingerprints included position,
every pull request that touches a file would report every pre-existing finding in
it as new, the comment would be noise, and the semantic diff would be a textual
diff wearing a hat.

**Cost:** two identical findings in one file need an occurrence index to stay
distinct, and that index has to be assigned after a deterministic sort so it is
stable between runs.

**Would make this wrong:** a rule that puts something position-dependent in
`evidence`. Documented in `docs/writing-a-rule.md` as the thing not to do.

---

## ADR-0006 — A layer that could not run is never reported as clean

**Date:** 2026-08-11 · **Status:** accepted

`coverage.layers[].ran` is false with a reason. The diff excludes layers that ran
on only one side and names them in `incomparableLayers`.

**Why:** reporting "12 accessibility violations fixed" because the head scan could
not launch a browser would be the single most damaging bug this product could
ship. It would be wrong in the direction of reassurance, in a product whose entire
value is being trustworthy about what it did and did not check.

**Consequence:** every consumer — terminal, markdown, SARIF, PR comment, exit code
— has to carry the distinction. Worth the repetition.

---

## ADR-0007 — Suppressions are recorded, not dropped

**Date:** 2026-08-11 · **Status:** accepted

Waived findings go into `report.suppressed` with the developer's reason, and are
included in the content hash.

**Why:** the question that gets asked is "what did you know and what did you do
about it". A tool whose output can be silenced invisibly is worthless as evidence,
and evidence is most of what is being sold.

---

## ADR-0008 — The content hash excludes time, path and revision

**Date:** 2026-08-11 · **Status:** accepted

Hashed: schema version, tool version, URLs, rules run, rules skipped, findings,
suppressions, metrics, coverage. Not hashed: scan id, timestamps, duration, root
directory, commit, branch, repository.

**Why:** so two scans of identical code produce an identical hash on any machine,
on any branch, at any time — which is what lets a third party recompute it. A hash
that changes when the clock changes proves nothing.

Tool version *is* included: a different engine is a different measurement and
should not silently compare equal.

---

## ADR-0009 — Playwright is an optional peer dependency

**Date:** 2026-08-11 · **Status:** accepted

`playwright` is an optional peer of `rules-a11y` and the CLI. Missing browser →
the runtime layer is skipped with a reason.

**Why:** `npx @attestci/cli scan .` has to work in seconds, on first contact,
before anyone trusts it. A 150MB browser download at that moment loses the user.

**Cost:** the highest-value accessibility rules need a second setup step. Mitigated
by the source-level rules working immediately and by the report saying loudly
which layer did not run.

---

## ADR-0010 — ts-morph is a dependency of core, exposed at `@attestci/core/static`

**Date:** 2026-08-11 · **Status:** accepted

**Why:** both rule packs need the same parsed project, and parsing is the most
expensive step in a scan. Putting the substrate in one place means rule authors
have one import and the parse is shared through `ScanInput.shared`.

**Rejected:** duplicating the project builder in each pack (drift, double parse),
and adding a fifth package (the repository layout is fixed, and a package per
utility is how a two-person-year codebase becomes a five-person-year one).

**Cost:** `core` is no longer dependency-free. Accepted: ts-morph is installed for
any real scan regardless, so making it optional would add complexity for no
benefit.

---

## ADR-0011 — Static accessibility rules are a small set that adds to axe, not a copy of it

**Date:** 2026-08-11 · **Status:** accepted

Six source-level rules, several overlapping `eslint-plugin-jsx-a11y`. Each
overlapping rule's docs page says so and says which to turn off.

**Why:** the honest reason to have them at all is that they run on components no
CI job renders, and that two of them (`form-error-not-associated`, and
placeholder-only fields in `label-association`) catch things axe deliberately
passes. Pretending to more than that would be the beginning of the tool nobody
trusts.

---

## ADR-0012 — axe rule severities are ours; axe best practices are labelled as such

**Date:** 2026-08-11 · **Status:** accepted

We map axe rule ids to our own severities and to WCAG criteria, and we never claim
a criterion axe does not. `heading-order` is labelled an axe best practice, not a
success criterion, because no WCAG SC requires sequential heading levels.

**Why:** axe scores the user harm of one instance; we score what should stop a
pull request. Different questions. And inflating a single criterion mapping makes
every other citation in the product untrustworthy.

---

## ADR-0013 — Merchant of Record, not raw Stripe

**Date:** 2026-08-11 · **Status:** accepted

Paddle (or Lemon Squeezy) becomes the legal seller of record.

**Why:** this removes 40+ jurisdictions of VAT/GST/sales-tax registration and
filing from a founder who cannot hire an accountant. The ~2% premium over bare
Stripe is the cheapest employee this business will ever have.

**Note:** Lemon Squeezy was acquired by Stripe in 2024 — check its current
positioning before committing. See `gtm/legal/mor-setup.md`.

---

## ADR-0014 — GitHub OAuth only

**Date:** 2026-08-11 · **Status:** accepted

No email/password, no magic links, no SAML, no SCIM.

**Why:** the buyer is already on GitHub, we need repository identity anyway, and
every additional auth method is an account-recovery support burden. SAML is on the
Do Not Build list because it is the first step of an enterprise sales motion.

---

## ADR-0015 — The append-only guarantee is enforced by the database

**Date:** 2026-08-11 · **Status:** accepted

A trigger rejects `UPDATE` and `DELETE` on `scans`. Each record carries the
previous record's hash for that repository, forming a chain.

**Why:** "we do not update these rows" is a convention, and a convention is not a
guarantee. Under a subpoena the difference between a convention and a constraint
is the whole question.

**Cost:** a single finding cannot be excised for a GDPR erasure request without
breaking the chain. Stated plainly in the DPA and the privacy policy, with the
remedy being to prevent personal data entering reports.

---

## ADR-0016 — The GitHub Action has no bundled `dist`

**Date:** 2026-08-11 · **Status:** accepted

A composite action running one dependency-free ESM file, which shells out to the
published CLI via npx and talks to the API with `fetch`.

**Why:** no build step to go stale, no committed bundle nobody reads, and someone
auditing what runs in their CI reads one file. `@actions/core` and
`@actions/github` are convenient and would each need bundling.

---

## ADR-0017 — Type-only imports are not edges in the client graph

**Date:** 2026-08-11 · **Status:** accepted · **Supersedes nothing; fixes a
shipped bug**

`import type { X } from './y'`, and `import { type X }` where every specifier is
type-only and there is no default or namespace import, are erased before bundling
and are not followed.

**Why:** found by scanning `vercel/ai-chatbot`. Following them reported
`lib/db/queries.ts` as browser-reachable through a chain of four type-only
imports — a **critical-severity false positive on the exact pattern every
well-organised TypeScript codebase uses.**

**Known gap:** under `verbatimModuleSyntax`, `import { type X }` is preserved as a
side-effect import and would ship. We accept missing that case. A missed finding
costs less than a false one, and Next.js does not generate that configuration.

---

## ADR-0018 — JSX tag matching is case-sensitive

**Date:** 2026-08-11 · **Status:** accepted · **Fixes a shipped bug**

`isTag` compares exactly. A lowercase name is a DOM element; a capitalised one is
a component.

**Why:** found by scanning `documenso`. A case-insensitive match treated `<Input>`
— a design-system wrapper that sets an id and spreads props we cannot see — as
`<input>`, and reported **106 phantom missing labels in one repository**. Left
unfixed it would have made the tool useless on any codebase with a design system,
which is every codebase worth scanning.

**Consequence:** components are never reported by rules that need DOM semantics.
Real problems inside wrappers are missed. That is the correct trade and it is
stated on each affected rule page.

---

## ADR-0019 — The scanner is validated against real repositories, not only fixtures

**Date:** 2026-08-11 · **Status:** accepted

The public scan programme (`gtm/public-scans/`) is a distribution channel second
and a correctness harness first.

**Why:** ADR-0017 and ADR-0018 were both found this way, within an hour, and
neither was caught by any fixture. Fixtures test what you thought of. Real
codebases test what you did not.

**Consequence:** every rule change ships with a re-scan of the three pinned
repositories, and every false positive found becomes a named regression fixture.

---

## ADR-0020 — LLM features are bounded and optional

**Date:** 2026-08-11 · **Status:** accepted

A model may *explain* a finding in plain language and *propose* a patch. A model
may never *produce* a finding. Every finding traces to static analysis, axe
output, a build artifact, or a reproducible test. Calls are cached, capped per
account, off by default, and the tool is fully functional without them. Token
spend is logged per account from the first call.

**Why:** the product's defensibility is determinism. A finding a model invented
cannot be defended to a maintainer, put in an evidence trail, or reproduced by a
third party — and one hallucinated finding in a public scan would end the
programme.
