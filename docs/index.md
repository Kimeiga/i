# Attest documentation

Attest is a deterministic CI check that catches accessibility and privacy-boundary
regressions in React and Next.js codebases, and produces a timestamped evidence
trail you can hand to a regulator.

> Attest owns the automatable subset of accessibility conformance, proves it does
> not regress, and produces the evidence trail. It does not make you compliant, and
> no tool can.

## Start here

- [Getting started](getting-started.md) — a first report in five minutes
- [What Attest cannot detect](what-attest-cannot-detect.md) — read this before telling anyone what it covers
- [Rules](rules/index.md) — all 30, with code that triggers each and code that does not

## Reference

- [Configuration](configuration.md)
- [Suppressions](suppressions.md)
- [The evidence trail](evidence-trail.md)
- [Report schema](report-schema.md)
- [Writing a rule](writing-a-rule.md)

## Context

- [Regulatory context](regulatory-context.md) — what was verified, when, and against which source. Not legal advice.
- [Changelog](changelog.md)

## The four layers

| Layer | Needs | Finds |
| --- | --- | --- |
| Runtime accessibility | A running app and a browser | WCAG failures in the real rendered DOM, via axe-core |
| Static accessibility | Source only | A narrower set, in the pull request that introduces it |
| Privacy and placement | Source only | Session data in shared caches, server values in the browser, effects repeated under retry |
| Client impact | Source, plus build output for byte figures | Startup JavaScript and avoidable round trips |

A layer that could not run is reported as **did not run**, never as clean. That
distinction is load-bearing throughout the product.

## Attribution

Runtime accessibility detection is performed by
[axe-core](https://github.com/dequelabs/axe-core), developed and maintained by Deque
Systems, used under the Mozilla Public License 2.0. Attest wraps axe-core; it does
not fork or modify it.

---

_Attest reports the results of automated checks. Automated testing detects only a
subset of accessibility barriers. A clean Attest run is not a conformance claim, a
legal opinion, or a substitute for testing with assistive technology and with
disabled users. This is not legal advice._
