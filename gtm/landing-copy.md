> **Superseded.** This file was the hand-written landing copy for v1. The live
> pages are now structured data in `apps/web/content/pages/*.json`, built from
> the briefs in [`conversion/positioning-hypotheses.md`](conversion/positioning-hypotheses.md)
> and checked against [`conversion/claims.yaml`](conversion/claims.yaml) by
> `scripts/check-claims.mjs`.
>
> It is kept because it records what v1 said, and because two things in it were
> wrong in ways worth remembering: it used "Scan a public page free" as the
> primary call to action for a hosted scanner that does not exist, and it showed
> pricing tiers as though they could be bought. Both are now blocked by the
> claim linter. The archived page itself is at `/v1` and the reasoning is at
> `/compare`.

---

# Landing page copy

Implemented in `apps/web`. Rules for anyone editing it:

- The automated-coverage limit appears **above the fold**, not in a footnote.
  Honesty is the differentiator against the overlay vendors, so it has to be
  visible or it is not doing its job.
- `scripts/check-forbidden-words.mjs` runs over `apps/web` in CI. A build that
  claims a compliance outcome does not ship.
- No animation, no scroll-jacking, no cookie banner, no chat widget. The audience
  is engineers and every one of those costs credibility.
- The page must pass its own scan.

---

## Above the fold

### Headline

> **Know what your pull request just broke.**

### Subhead

> Attest is a CI check for React and Next.js that reports what changed about your
> app's accessibility conformance, privacy boundaries and client cost — and keeps
> a timestamped, verifiable record of every scan.

### The thing itself

A real pull request comment, not a mockup:

```
Accessibility conformance changed
checkout/PaymentForm: 3 new WCAG 2.1 AA violations (label association, focus order)

Privacy boundary changed
customer_profile: session-private → reachable from shared cache

Client impact
+18 KB startup JavaScript, one new sequential server fetch
```

### Install

```bash
npx @attestci/cli scan .
```

No account. No signup. No telemetry.

### The limit, stated here

> Automated tooling can evaluate roughly a quarter to a third of WCAG 2.1 success
> criteria. Attest owns that part, proves it does not regress, and produces the
> evidence trail. **It does not make you compliant, and no tool can.**
> [What Attest cannot detect →](/docs/what-attest-cannot-detect)

That paragraph is the most important on the page. It goes above the fold, in body
text, not in grey 12px at the bottom.

---

## Section: what it catches that nothing else does

### Session data entering a shared cache

```ts
const response = await fetch('/api/customer_profile', {
  headers: { Authorization: `Bearer ${token}` },
  next: { revalidate: 3600 },        // ← shared across every visitor
})
```

The Next.js Data Cache is keyed by URL, not by user. This serves one customer's
profile to the next visitor who loads the same page. It works perfectly in
development, where there is one user.

axe cannot see it — it evaluates rendered DOM. ESLint cannot see it — it reads one
file at a time. **This is the finding this product exists for.**

### Server values reaching the browser through an import chain

```
components/cart/modal.tsx  →  lib/utils.ts  →  process.env.VERCEL_PROJECT_PRODUCTION_URL
      'use client'              no directive        undefined in the browser
```

That is a real finding from a real scan of
[Next.js Commerce](/scans/vercel-commerce). `lib/utils.ts` has no `'use client'`
in it. It is browser code because something imported it, and the value it reads is
`undefined` there — silently, with no error.

`'use client'` marks a boundary, not a file. Following that boundary through the
whole import graph is the analysis nothing else does.

### Accessibility, from axe-core, on every pull request

We run [axe-core](https://github.com/dequelabs/axe-core) — Deque's, unmodified,
credited — against your real rendered DOM, plus source-level rules that catch a
narrower set without needing a browser.

The difference from running axe yourself is not detection. It is that this runs
every time, reports what *changed*, and remembers.

---

## Section: the evidence trail

Every scan is timestamped and content-hashed. Two scans of identical code produce
an identical hash on any machine, so a third party can recompute it.

Suppressions stay in the record, with the reason the developer gave. A finding you
waived on 3 March is in the trail with your reason attached — because the question
that gets asked is *what did you know and when*, and "we waived it, here's why" is
an answer. A tool whose output can be silenced invisibly is worthless as evidence.

Storage is append-only, hash-chained, and exportable as signed JSON and PDF that
anyone can verify without an account.

[How the evidence trail works →](/docs/evidence-trail)

---

## Section: what it does not do

Linked from the nav, not buried.

- It does not tell you whether your alt text is *correct*. No tool can.
- It does not test with a screen reader, and you should.
- It does not check PDFs, video captions, or native mobile apps — all of which
  EN 301 549 covers.
- It does not scan pages you do not point it at.
- **It will never ship an overlay or a widget.** Overlays do not produce
  conformance, and in January 2025 the US Federal Trade Commission ordered
  accessiBe to pay $1,000,000 over claims that its AI could make sites conform to
  WCAG. That is the failure mode this product is built to avoid.

[The full list →](/docs/what-attest-cannot-detect)

---

## Section: pricing

| | Free | Solo | Team |
| --- | --- | --- | --- |
| | $0 | **$49** /repo/month | **$299** /month |
| CLI, all 30 rules, local reports | ✓ | ✓ | ✓ |
| GitHub Action, PR comment | ✓ | ✓ | ✓ |
| JSON, SARIF, badge | ✓ | ✓ | ✓ |
| Historical trend and regression tracking | | ✓ | ✓ |
| Signed evidence export (JSON + PDF) | | | ✓ |
| Organisation-wide policy | | | ✓ |
| Accessibility statement generation | | | ✓ |
| Repositories | unlimited, local | 1 | 10 |

The free tier is not a trial. It is the whole tool, MIT licensed, and it stays
that way. You pay for memory, not for detection.

No enterprise tier, no sales calls, no annual contracts. If you need procurement,
we are not a good fit and will say so.

---

## Section: FAQ

**Do I need to run my app for this to work?**
No. Source-level checks run on any checkout. The runtime accessibility checks need
a running app and a browser; without them that layer is reported as *did not run*,
never as clean.

**Does it work with Vue / Svelte / Rails / plain HTML?**
The runtime accessibility layer would, because axe runs against a rendered DOM. The
privacy and placement layer — the reason to choose this over a generic scanner —
is React and Next.js only. If you are not on React, you probably want something
else.

**We already run axe in CI.**
Then you have most of the accessibility half. Two things you do not have: a record
over time, and the privacy layer. If neither matters to you, do not buy this.

**Will this make us compliant?**
No. Conformance is a determination about a whole service, normally involving a
human audit and disabled users. This handles the mechanical part and dates it.
Anyone who tells you otherwise is selling you the thing the FTC fined accessiBe
for.

**Do you have SOC 2?**
No, and we are not going to. If your procurement process requires it, we are not a
good fit.

**Is my code sent anywhere?**
The CLI runs entirely locally and sends nothing. The hosted service receives the
report — findings, file paths, line numbers, and short code excerpts — not your
repository. [Privacy policy →](/legal/privacy)

---

## Footer

> Attest reports the results of automated checks. Automated testing detects only a
> subset of accessibility barriers. A clean Attest run is not a conformance claim,
> a legal opinion, or a substitute for testing with assistive technology and with
> disabled users. This is not legal advice.
>
> Runtime accessibility detection is performed by
> [axe-core](https://github.com/dequelabs/axe-core), developed and maintained by
> Deque Systems, used under the Mozilla Public License 2.0.
