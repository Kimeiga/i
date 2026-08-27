# Writing a rule

The constraint this architecture was designed around: **a rule must be writable,
testable, documented and shippable in one 90-minute session.** If that stops being
true, the interface is wrong and the interface gets fixed, not the schedule.

Adding a rule never requires touching the engine.

## What a rule is

A plain object with static metadata and a `check` function.

```ts
import type { RawFinding, Rule } from '@attestci/core'
import { excerpt, getJsxTags, hasAttribute, locationOf, type StaticContext } from '@attestci/core/static'

const rule: Rule<StaticContext> = {
  id: 'a11y/autoplay-video',
  kind: 'static-a11y',
  title: 'Video plays automatically',
  description: 'A <video> element with autoplay and no muted attribute starts sound…',
  severity: 'serious',
  docs: 'a11y-autoplay-video',
  standards: [WCAG.audioControl],
  fixtures: {
    triggering: ['fixtures/a11y-static/autoplay-video/triggering.tsx'],
    clean: ['fixtures/a11y-static/autoplay-video/clean.tsx'],
  },
  check(ctx) {
    const findings: RawFinding[] = []
    for (const file of ctx.files) {
      for (const tag of getJsxTags(file)) {
        if (!isTag(tag, 'video')) continue
        if (!hasAttribute(tag, 'autoPlay')) continue
        if (hasAttribute(tag, 'muted')) continue
        findings.push({
          message: 'This <video> plays with sound as soon as the page loads.',
          location: locationOf(tag, ctx.rootDir),
          evidence: excerpt(tag),
          help: 'Add muted, or remove autoPlay and let the user start playback.',
          surface: ctx.relative(file),
        })
      }
    }
    return findings
  },
}

export default rule
```

Then one import and one array entry in the pack's `index.ts`. That is the whole
registration.

## The five steps

1. **Write the fixtures first.** `fixtures/<group>/<rule-slug>/triggering.tsx` and
   `clean.tsx`. The clean one is the important one — see below.
2. **Write the rule.** Use the helpers; they exist so rules stay short enough to
   read in one screen.
3. **Register it** in the pack's `index.ts`.
4. **Write the notes** in `docs/rules/notes/<slug>.md` if there is judgement to
   record, then `pnpm docs:rules`.
5. **`pnpm check`.** The fixture harness, the docs-coverage check and the
   generated-docs freshness check all have to pass.

## The clean fixture is the point

The harness asserts three things:

- every declared triggering file produces at least one finding
- every declared clean file produces **zero**
- no finding lands in an undeclared file

That third one exists so a rule cannot pass by reporting somewhere nobody is
looking.

A rule that finds real problems and also fires on correct code is worse than no
rule, because the first false positive teaches a team to ignore everything the tool
says afterwards. Write the clean fixture to include the tempting near-misses: the
spread props, the dynamic value, the correct-but-unusual pattern. When you cannot
prove something is wrong, do not report it.

## Contexts

| Kind | Context | What you get |
| --- | --- | --- |
| `static-a11y` | `StaticContext` | Parsed sources, JSX helpers, the client import graph |
| `static-privacy` | `StaticContext` | The same |
| `client-impact` | `StaticContext` | The same |
| `runtime-a11y` | `RuntimeA11yContext` | axe-core results per page |

`StaticContext` gives you `files`, `clientGraph`, `isClientReachable`,
`isClientBoundary`, `isRouteHandler`, `isServerActionModule`, `isServerOnly` and
`relative`. If your rule needs something that is not there, **add it to the context
rather than reaching into ts-morph inside the rule** — the next rule gets it for
free, and that is what keeps the 90-minute promise true.

## Wrapping an axe rule

Runtime accessibility rules are declarative. No code:

```ts
axeRule({
  id: 'a11y/valid-lang',
  axeRuleId: 'valid-lang',
  title: 'Language attribute has an invalid value',
  description: '…',
  severity: 'moderate',
  docs: 'a11y-valid-lang',
  standards: [WCAG.languageOfParts],
  fixtures: fixtures('valid-lang'),
})
```

The fixtures are HTML pages. The test suite serves them from a local HTTP server and
runs a real browser against them.

Two rules about mapping:

**Do not claim a WCAG criterion axe does not.** If axe tags a rule `best-practice`,
map it to `BEST_PRACTICE`, not to a criterion that looks close. Inflating the mapping
makes every other citation in the product untrustworthy.

**Severity is ours, not axe's `impact`.** axe scores the user harm of one instance;
we score what should stop a pull request. The axe impact still travels into the
finding's evidence.

## Fingerprints, and the thing you must not break

The engine computes each finding's fingerprint from the rule id, the file (or page
and selector), the normalised evidence, and an occurrence index. **Line and column
are deliberately excluded.**

That is why adding an import at the top of a file does not report every finding
below it as new. If a rule puts something position-dependent in its `evidence` — a
line number, a generated id, a timestamp — it breaks that property for itself, every
edit to the file churns its findings, and the diff becomes noise.

Keep `evidence` to the offending code.

## Severity

| Severity | Means |
| --- | --- |
| `critical` | Data exposure, or a control that is completely unusable by some people |
| `serious` | A real barrier or a real defect, with a clear fix |
| `moderate` | Degrades the experience, or costs measurably, with a judgement call in the fix |
| `minor` | Worth knowing, not worth blocking |

`failOn: serious` is the default, so the boundary between `moderate` and `serious`
is the boundary between advisory and blocking. Calibrate against the existing rules
rather than in isolation.

## Experimental rules

If a rule over-reports on some shapes of codebase, mark it `experimental: true`. It
is then off unless explicitly enabled, and the docs page says so. Being honest about
a heuristic costs less than losing a user to it.
