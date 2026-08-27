# Contributing

The most useful contribution is **a false positive report**. They are the highest
priority thing in the queue, ahead of every feature, because one false positive
teaches a team to ignore everything the tool says.

## Reporting a false positive

Open an issue with:

1. The rule id
2. The code it fired on, reduced as far as you can
3. Why the code is correct as written

Two have been fixed this way already, both found by scanning real repositories.
Both are written up publicly with before-and-after counts. Yours will be too.

## Adding a rule

Read [docs/writing-a-rule.md](docs/writing-a-rule.md) first. In short:

1. Write the fixtures — `triggering` **and** `clean`. The clean one is the point.
2. Write the rule. Use the helpers in `@attestci/core/static`.
3. Register it: one import, one array entry in the pack's `index.ts`.
4. Write `docs/rules/notes/<slug>.md` if there is judgement to record, then
   `pnpm docs:rules`.
5. `pnpm check`.

A rule must be writable, testable, documented and shippable in one 90-minute
session. If the interface makes that impossible, that is a bug in the interface —
please say so.

## The bar for a new rule

- **It must not fire on correct code.** When you cannot prove something is wrong,
  do not report it. A rule that is right 90% of the time is not 90% of a rule.
- **It should catch something else does not.** Overlap with
  `eslint-plugin-jsx-a11y` or axe is acceptable if the rule earns its place another
  way, but the docs page must say so and say which to turn off.
- **It must map honestly.** Never claim a WCAG success criterion the rule does not
  actually test. If it is a best practice, label it one.
- **It needs a real fix.** A finding without an actionable `help` is a complaint.

## Development

```bash
pnpm install
pnpm check                    # build, claims, tests, docs
pnpm test -- --watch
pnpm docs:rules               # regenerate rule pages
```

Runtime accessibility tests need a browser:

```bash
npx playwright install chromium
# or, if your image ships one:
export ATTEST_CHROMIUM_PATH=/path/to/chrome
```

Without one, those tests skip and print why. They never pass silently.

## Commits

Conventional commits. `feat(rules-privacy): …`, `fix(core): …`, `docs: …`.

Explain **why** in the body, not what — the diff already says what. A commit
message that records the reasoning is the thing that makes this codebase
transferable, which is an explicit objective.

## What will not be accepted

- Any overlay, widget, or runtime "fix" mechanism. This is not a roadmap position.
- Support for another framework family. React and Next.js only, deliberately.
- A rule that produces findings a model generated. Every finding traces to static
  analysis, axe output, a build artifact, or a reproducible test.
- Marketing language in any user-facing surface. CI will reject it anyway.

## Licence

Contributions to `packages/` are MIT. `apps/` is proprietary and closed to
contributions.
