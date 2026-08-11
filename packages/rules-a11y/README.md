# `@attestci/rules-a11y`

Accessibility rules for [Attest](https://attest.ci). MIT licensed.

**14 runtime rules** wrapping [axe-core](https://github.com/dequelabs/axe-core)
against a real rendered DOM, and **6 static rules** that need no browser.

## axe-core does the runtime detection

axe-core is developed and maintained by [Deque Systems](https://www.deque.com/)
and used here under the Mozilla Public License 2.0. This package **wraps it and
forks nothing**. The detection logic is theirs, it is better than anything we
would write, and every finding links back to Deque's own explanation.

What this package adds: our own severities, calibrated for what should stop a
pull request rather than for the harm of a single instance; explicit WCAG 2.1
criterion mappings; and fixture pages that prove each rule fires where it should
and stays quiet where it should not.

**Where axe classifies a rule as a best practice, so do we.** `heading-order` is
labelled an axe best practice rather than a success criterion, because no WCAG SC
requires sequential heading levels. Inflating one mapping makes every other
citation untrustworthy.

## The static rules

Six source-level rules that run without a browser, so they catch things in the
pull request that introduces them, on components no CI job renders. Several
overlap `eslint-plugin-jsx-a11y`; where they do, the docs page says so and says
which to turn off.

Two of them are deliberately stricter than axe, both documented:
placeholder-only form fields, and invalid fields with no associated error
message.

---

_Automated testing detects only a subset of accessibility barriers. Not legal
advice._
