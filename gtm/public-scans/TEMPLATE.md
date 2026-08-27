# Scanning <Project>

**Project:** [owner/project](https://github.com/owner/project) — one line on what it is
**Commit:** `<full sha>`
**Scanned:** <date> with Attest <version>
**Report:** [JSON](reports/<slug>.json) · [Markdown](reports/<slug>.md) · `sha256:…`
**Findings:** <n>, across <n> source files

---

<Two or three sentences on what the project is and why it was worth scanning.
Lead with something true and positive. If the codebase is good, say so — it
almost always is, and a page that opens with praise is read differently from one
that opens with a count.>

**State the scope limits here, before the findings.** Which layers ran, which did
not, and what that means. If no page was rendered, say that no accessibility
finding on this page depends on a rendered DOM. If the project is not Next.js, say
which rules therefore had nothing to work with.

---

## <The most interesting finding, as a heading a person would read>

**`path/to/file.ts:LINE`** — `rule/id`, severity

```ts
// the actual code, quoted exactly
```

<Why it is a problem in this codebase specifically. Not the generic rule
description — the reader can click through for that. What breaks, for whom, and
under what conditions.>

<If it is real-but-benign, say so plainly. Credibility is the asset.>

**Fix:** <the specific change, not the general advice.>

---

## <Second category>

<Group the rest. A table works well when the same finding recurs.>

---

## What we got wrong

<Mandatory section. If the scan surfaced a false positive, describe it precisely:
what was reported, why it was wrong, what changed, and the before/after numbers.
If nothing was wrong, say that and point at what was wrong in a previous scan.>

<This is the most valuable section on the page. A tool whose false positives you
only discover yourself is a tool you should not install.>

---

## Upstream

<What was filed, or what would be filed and why it has not been. Link the issue or
pull request. If a finding is deliberately not being reported upstream — a
performance suggestion across 25 files is not a good drive-by contribution — say
why.>

<Never pitch the product in an upstream issue.>

---

## Reproducing this

```bash
git clone --depth 1 https://github.com/owner/project.git
cd project && git checkout <sha>
npx @attestci/cli@<version> scan . --fail-on never --json report.json
```

---

_Attest reports the results of automated checks. <State the specific limits of
this scan again.> Nothing here is a conformance claim about <project>, and nothing
here is legal advice._
