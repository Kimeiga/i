# Attest

**A CI check for React and Next.js that reports what your pull request just
changed about accessibility conformance, privacy boundaries and client cost — and
keeps a timestamped, verifiable record of every scan.**

> Attest owns the automatable subset of accessibility conformance, proves it does
> not regress, and produces the evidence trail. It does not make you compliant,
> and no tool can.

```bash
npx @attestci/cli scan .
```

No account. No signup. No telemetry.

---

## What it produces

A semantic diff on every pull request — not a list of lint errors, but a statement
of what changed:

```
Accessibility conformance changed
checkout/PaymentForm: 3 new WCAG 2.1 AA violations (label association, focus order)

Privacy boundary changed
customer_profile: session-private → reachable from shared cache

Client impact
+18 KB startup JavaScript, one new sequential server fetch
```

Findings are fingerprinted without line numbers, so adding an import at the top of
a file does not report everything below it as new.

## The part nothing else checks

```ts
const response = await fetch('/api/customer_profile', {
  headers: { Authorization: `Bearer ${token}` },
  next: { revalidate: 3600 },        // ← a cache shared by every visitor
})
```

The Next.js Data Cache is keyed by URL, not by user. This serves one customer's
profile to the next visitor. It works perfectly in development, where there is one
user.

axe cannot see it — it evaluates rendered DOM. ESLint cannot see it — it reads one
file at a time. Scanning [Next.js Commerce](gtm/public-scans/2026-08-vercel-commerce.md)
found a related shape: `lib/utils.ts`, with no `'use client'` in it anywhere,
reaching the browser through `components/cart/modal.tsx` and reading an
environment variable that is `undefined` there. `'use client'` marks a boundary,
not a file.

## The four layers

| Layer | Needs | Finds |
| --- | --- | --- |
| Runtime accessibility | A running app and a browser | WCAG failures in the real DOM, via axe-core |
| Static accessibility | Source only | A narrower set, in the PR that introduces it |
| Privacy and placement | Source only | Session data in shared caches, server values in the browser, effects repeated under retry |
| Client impact | Source, plus build output | Startup JavaScript and avoidable round trips |

**A layer that could not run is reported as "did not run", never as clean.** That
distinction is load-bearing everywhere: in the report, in the diff, in the exit
code, and in the SARIF.

## What it cannot do

Automated tooling can evaluate roughly **a quarter to a third** of WCAG 2.1
success criteria. The rest — whether alt text is *correct*, whether reading order
makes sense, whether focus goes somewhere sensible, whether an error message helps
— requires a person.

It will never ship an overlay, a widget, or a runtime "fix" script.

**[Read the full list of what Attest cannot detect →](docs/what-attest-cannot-detect.md)**
That page is linked from the CLI help and the bottom of every report, because a
vendor who will not state their limits is telling you something else.

## Getting started

```bash
# Source-level checks, no browser needed
npx @attestci/cli scan .

# Add the runtime accessibility checks
npm i -D playwright && npx playwright install chromium
npx @attestci/cli scan . --url http://localhost:3000
```

In CI:

```yaml
- uses: actions/checkout@v4
  with: { fetch-depth: 0 }
- uses: attest-ci/attest-action@v1
```

[Getting started →](docs/getting-started.md) · [Rules →](docs/rules/index.md) ·
[Configuration →](docs/configuration.md)

## Repository layout

```
packages/core          Rule engine, report schema, semantic diff        MIT
packages/rules-a11y    axe-core wrapper + source-level a11y rules       MIT
packages/rules-privacy Privacy, placement and client-cost rules         MIT
packages/cli           The attest CLI                                   MIT
packages/action        GitHub Action                                    MIT
apps/api               Hosted evidence store and API                    proprietary
apps/web               Landing page, docs, dashboard                    proprietary
fixtures/              Code that must trigger each rule, and must not
docs/                  Public documentation
gtm/                   Positioning, public scans, launch, legal
```

## Open core

The CLI, every rule, the GitHub Action, the PR comment, SARIF output and the badge
are MIT licensed and stay that way. You pay for **memory**, not detection:
historical trends, organisation policy, signed evidence exports, and accessibility
statement generation.

The free tier is not a trial. It is the whole tool.

## Development

```bash
pnpm install
pnpm check        # build, claim check, tests, docs coverage
```

`pnpm check` runs four gates:

- **`lint:claims`** greps `docs/`, `gtm/`, `apps/web/` and the READMEs for phrases
  asserting a compliance outcome, and fails the build. It is a legal control
  implemented as a test.
- **`test`** runs every rule against code that must trigger it and code that must
  not. The runtime accessibility rules run against a real browser.
- **`lint:rule-docs`** fails if a registered rule has no docs page or no fixtures,
  or if the generated pages are stale.
- **`build`** typechecks the whole workspace.

[Writing a rule →](docs/writing-a-rule.md). A rule must be writable, testable,
documented and shippable in one 90-minute session; if that stops being true, the
interface is wrong.

## Attribution

Runtime accessibility detection is performed by
[axe-core](https://github.com/dequelabs/axe-core), developed and maintained by
[Deque Systems](https://www.deque.com/), used under the Mozilla Public License
2.0. Attest wraps axe-core; it does not fork or modify it.

## Licence

MIT for everything under `packages/`. See [LICENSE](LICENSE).
`apps/` is proprietary — see [apps/LICENSE](apps/LICENSE).

---

_Attest reports the results of automated checks. Automated testing detects only a
subset of accessibility barriers. A clean Attest run is not a conformance claim, a
legal opinion, or a substitute for testing with assistive technology and with
disabled users. This is not legal advice._
