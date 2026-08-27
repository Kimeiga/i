# `@attestci/cli`

The `attest` command line interface. MIT licensed, no telemetry, no account.

```bash
npx @attestci/cli scan .
```

> Attest owns the automatable subset of accessibility conformance, proves it does
> not regress, and produces the evidence trail. It does not make you compliant,
> and no tool can.

## What it does

Scans a React or Next.js codebase across four layers and reports what it found —
or, given a baseline, what *changed*.

| Layer | Needs | Finds |
| --- | --- | --- |
| Runtime accessibility | A running app and a browser | WCAG failures in the real DOM, via axe-core |
| Static accessibility | Source only | A narrower set, without a browser |
| Privacy and placement | Source only | Session data in shared caches, server values in the browser, effects repeated under retry |
| Client impact | Source, plus build output | Startup JavaScript and avoidable round trips |

**A layer that could not run is reported as "did not run", never as clean.**

## Commands

```
attest scan [dir]              Run the checks
attest diff <base> <head>      Compare two reports and describe what changed
attest badge <report>          Render an SVG badge
attest rules                   List the 30 rules this build ships
attest explain <rule-id>       Explain one rule in full
attest init [dir]              Write a config file
```

### Useful flags

```
--url <url>              Render this URL and run axe-core against it (repeatable)
--json <path>            Full report, canonical JSON, content-hashed
--sarif <path>           SARIF 2.1.0 for GitHub code scanning
--baseline <report>      Compare against a previous report
--fail-on <severity>     minor | moderate | serious | critical | never
--fail-on-new-only       Only fail on findings absent from the baseline
```

Exit codes: `0` nothing at or above the threshold, `1` findings at or above it,
`2` usage or configuration error.

## Runtime accessibility checks

They need Playwright and a browser, which are optional peer dependencies so that
first contact with this tool costs seconds rather than a 150MB download:

```bash
npm i -D playwright && npx playwright install chromium
attest scan . --url http://localhost:3000
```

Without them the runtime layer is reported as skipped, with the reason.

## Suppressions

```ts
// attest-disable-next-line privacy/session-data-in-shared-cache -- catalogue is public
```

Suppressed findings stay in the report with the reason you gave. That is
deliberate: a suppression is a decision, and the evidence trail keeps decisions.

## What it cannot do

Automated tooling can evaluate roughly a quarter to a third of WCAG 2.1 success
criteria. The rest — whether alt text is *correct*, whether reading order makes
sense, whether focus goes somewhere sensible — needs a person.

**[What Attest cannot detect](https://attest.ci/docs/what-attest-cannot-detect)**

## Attribution

Runtime accessibility detection is performed by
[axe-core](https://github.com/dequelabs/axe-core), developed and maintained by
Deque Systems, used under the Mozilla Public License 2.0. Attest wraps axe-core;
it does not fork or modify it.

---

_Attest reports the results of automated checks. A clean run is not a conformance
claim, a legal opinion, or a substitute for testing with assistive technology and
with disabled users. This is not legal advice._
