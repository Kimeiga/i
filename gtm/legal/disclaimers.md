# The standard disclaimer blocks

**Template. Not reviewed by a lawyer. Not legal advice.**

These are not decoration. They are the mechanism by which the product's claims
stay inside what it can defend, and they are emitted from constants in
`packages/core/src/product.ts` so that no surface can quietly drop one.

---

## Block A — the standard disclaimer

`DISCLAIMER`. Appears at the end of every report, every export, every docs page,
the CLI output, the pull request comment, and in the Terms of Service.

> Attest reports the results of automated checks. Automated testing detects only a
> subset of accessibility barriers. A clean Attest run is not a conformance claim,
> a legal opinion, or a substitute for testing with assistive technology and with
> disabled users. This is not legal advice.

**Do not shorten it. Do not paraphrase it. Do not make it a link.**

---

## Block B — the coverage note

`AUTOMATED_COVERAGE_NOTE`. Above the fold on the landing page, in the CLI help, in
every report, at the top of the rules index.

> Automated tooling can evaluate roughly a quarter to a third of WCAG 2.1 success
> criteria. The rest — meaningful alt text, logical reading order, usable focus
> management, comprehensible error recovery — requires human judgement. Attest does
> not attempt them and does not report on them.

A range, not a number, and the reason is in the constant's own comment: published
estimates vary by methodology and we have not run our own study. Anyone quoting a
precise figure for their own coverage either has a study they will show you, or is
guessing.

---

## Block C — the canonical claim

`CANONICAL_CLAIM`. The outer boundary of what may be said about the product.

> Attest owns the automatable subset of accessibility conformance, proves it does
> not regress, and produces the evidence trail. It does not make you compliant, and
> no tool can.

---

## Block D — attribution

`ATTRIBUTION`. Wherever runtime findings are shown, plus the README and the docs
index.

> Runtime accessibility detection is performed by axe-core, developed and
> maintained by Deque Systems, used under the Mozilla Public License 2.0. Attest
> wraps axe-core; it does not fork or modify it.

Both a licence obligation and the reason the accessibility community will listen
to you at all.

---

## Block E — regulatory references

Attach to any mention of the EAA, EN 301 549, WCAG obligations, penalties, or
enforcement:

> This is not legal advice. See [regulatory
> context](https://attest.ci/docs/regulatory-context) for the primary sources and
> for what we could not verify.

Never state a penalty figure, a deadline, or an obligation without a link to a
primary source, and never assert that any of it applies to a specific reader's
business.

---

## Block F — public scan pages

> Attest reports the results of automated checks. [State the specific limits of
> this scan.] Nothing here is a conformance claim about [project], and nothing here
> is legal advice.

The bracketed part must be filled in specifically — "no page was rendered, so
nothing here depends on a rendered DOM", "the privacy rules had nothing to work
with in this Remix application". Generic is not good enough on a page that names
somebody else's code.

---

## Enforcement

`scripts/check-forbidden-words.mjs` runs in CI over `docs/`, `gtm/`, `apps/web/`
and the READMEs. It fails the build on any phrase asserting a compliance outcome.
The pattern list lives in `FORBIDDEN_CLAIM_PATTERNS` in the same file as the
disclaimer constants, so the copy and the check cannot drift apart.

Two kinds of line legitimately contain a banned phrase: a quotation of somebody
else's claim (the FTC's characterisation of accessiBe's marketing, an overlay
vendor's own words), and an explicit denial of one ("we are not SOC 2
certified"). Mark those `claims-ok: <reason>` and the check skips them. The
marker applies to its own line and the line below it.

The check deliberately does not try to recognise negation on its own. A regex
that understands "not" well enough to be trusted with a legal control does not
exist, and a control that silently permits a whole class of sentence is not a
control.

## Why this is a code-level control

A solo founder with no lawyer cannot afford to discover in a deposition that a
landing page said something that read better at 11pm. The check is cheap, it runs
on every commit, and it is the difference between a claim discipline that survives
being tired and one that does not.
