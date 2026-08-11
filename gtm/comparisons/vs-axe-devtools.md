# Attest vs axe DevTools

**Short version: we run axe-core. If you already run axe in CI on every route and
track the results over time, you have most of what we do on the accessibility
side.**

axe-core is made by [Deque Systems](https://www.deque.com/), it is the best
accessibility detection engine that exists, it is open source under the Mozilla
Public License 2.0, and we use it unmodified. We have not forked it and we do not
intend to. Everything Attest reports about a rendered page comes from axe-core,
and every finding links back to Deque's own explanation.

axe DevTools is Deque's commercial product line around that engine: a browser
extension, a CI runner, an IDE integration, and Intelligent Guided Tests that walk
a human through the checks a machine cannot do.

## Side by side

| | axe DevTools | Attest |
| --- | --- | --- |
| Detection engine | axe-core | axe-core |
| Browser extension | Yes | No |
| Guided manual testing | Yes — Intelligent Guided Tests | No |
| Frameworks | Any rendered page | Any rendered page, **plus** React/Next source analysis |
| Reports what *changed* on a PR | Partly | Yes, as a semantic diff |
| Client/server boundary analysis | No | Yes |
| Cache-scope and retry-safety analysis | No | Yes |
| Content-hashed, append-only evidence trail | No | Yes |
| Suppressions recorded with reasons | No | Yes |
| Free tier | Yes, extension | Yes, the whole CLI and Action, MIT |
| Pricing | Per seat, published on their site | $49/repo/month, $299/month team |

## What axe DevTools does better

**Guided manual testing.** Intelligent Guided Tests walk a human through the
checks automation cannot do — the ones on
[our limits page](../../docs/what-attest-cannot-detect.md) as things no tool can
judge. That is a genuinely different product from ours and it addresses the
larger share of WCAG. We do not have anything like it and are not building one.

**The browser extension.** Debugging a specific element in front of you, with the
DOM inspector and the rule explanation side by side, is the right tool for that
job and we do not compete with it.

**Depth and provenance.** They maintain the engine. When a rule's behaviour is
subtle, they are the authority — including on ours, since ours is theirs.

**Framework breadth.** Any rendered page, any stack.

## What Attest does that axe DevTools does not

**The privacy and placement layer.** Session-scoped data entering a shared cache,
server values reaching the browser through a five-hop import chain, non-idempotent
requests under automatic retry, work scheduled past the end of a request. axe
evaluates a rendered DOM; these are not visible in one. This is most of the reason
to use us.

**A semantic diff rather than a list.** Findings are fingerprinted without line
numbers, so an import added at the top of a file does not report everything below
it as new. The pull request comment says what this change did, which is the only
form anyone acts on.

**The evidence trail.** Content-hashed reports, append-only storage, hash-chained
records, suppressions kept with the reason the developer gave, signed exports
anyone can verify. This has nothing to do with detection and is the thing that
makes the subscription worth renewing after the first clean-up.

**Source-level accessibility rules that need no browser.** Narrower than the
runtime set, but they run on components no CI job renders.

## When you should not use Attest

- **You are not on React or Next.js.** The layer worth paying for does not apply.
  Use axe DevTools.
- **You need guided manual testing.** We have none. Use axe DevTools.
- **You want a browser extension.** We do not have one and are not building one.
- **You already run axe in CI, on every route, with history.** You have most of
  the accessibility half. Buy us for the privacy layer and the evidence trail, or
  do not buy us.
- **You have a dedicated accessibility team.** They already have tools and
  opinions, and ours is unlikely to be the missing piece.

## Using both

Reasonable, and what we would do. axe DevTools in the browser while building and
for guided manual testing; Attest in CI to stop regressions and keep the record.
They are the same engine, so the findings agree.

---

_We are not affiliated with Deque Systems. This page describes a product we do not
control; check their site for current features and pricing. If anything here is
out of date or unfair, [open an issue](https://github.com/attest-ci/attest/issues)
and we will fix it._
