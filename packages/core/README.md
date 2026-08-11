# `@attestci/core`

The rule engine, report schema, and semantic diff for [Attest](https://attest.ci).
**Contains no rules of its own.**

MIT licensed. You want [`@attestci/cli`](https://www.npmjs.com/package/@attestci/cli)
unless you are writing rules or building on the report format.

## What is in here

- **The rule interface.** A rule is a plain object with static metadata and a
  `check` function. Adding one never touches the engine.
- **The engine.** Runs packs, isolates rule failures as recorded skips, applies
  suppressions, assigns fingerprints, and produces a content-hashed report.
- **The semantic diff.** Compares two reports by fingerprint, so an import added
  at the top of a file does not report everything below it as new.
- **`@attestci/core/static`** — the shared TypeScript/JSX analysis substrate:
  parsed project, JSX helpers, and the `'use client'` import graph.
- **`@attestci/core/testing`** — the fixture harness, so a rule you write is
  tested the same way ours are.

## Two invariants worth knowing about

**A rule that throws is recorded as a skip, not as a clean result.** A crash in
one rule silently zeroing a CI check is worse than a missing rule.

**A layer that could not run is reported as "did not run".** The diff excludes
layers that ran on only one side. Reporting violations as fixed because the head
scan could not launch a browser would be the most damaging bug this could ship.

## Writing a rule

See [the guide](https://attest.ci/docs/writing-a-rule). A rule must be writable,
testable, documented and shippable in one 90-minute session; if the interface
stops allowing that, the interface is wrong.

---

_Not legal advice. Automated testing detects only a subset of accessibility
barriers._
