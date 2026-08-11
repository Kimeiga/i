## Why it matters

A control nothing can label is announced as "edit text, blank". The visible caption beside it is not
connected to it, so clicking the caption does not focus the field, and a screen reader user moving
through the form by control never hears what any of them are for.

The bar for reporting is deliberately high — no id, no `aria-label`, no `aria-labelledby`, no
`title`, no wrapping `<label>`, no spread props. A control in that state cannot be labelled by
anything in any file, which makes the finding safe to report from source alone.

**A placeholder is not a label.** It disappears the moment the field has a value, so it is gone
exactly when a user checking their work needs it. Note that axe-core does *not* report a
placeholder-only field: the placeholder does supply an accessible name under the accessible-name
computation, so the markup is valid. It is a usability failure against WCAG 3.3.2 rather than a
markup error, and it is one of the few places where this rule is stricter than the runtime scan.

## How to fix it

Give the control an id and point a `<label htmlFor>` at it, or wrap it in a `<label>`. Where there
is genuinely no visible caption — a search field with a magnifying-glass button — use `aria-label`.

`useId()` is the right way to generate the id in a reusable component.

## What this rule will not catch

The case it deliberately does not report: a control that *has* an id whose `<label>` lives in a
different component. Proving that association needs the render tree, which is what the runtime scan
is for. Reporting it from source would produce a false positive on every design system that splits
`Field` and `Input`, which is most of them.

`eslint-plugin-jsx-a11y` covers similar ground with `label-has-associated-control`. If you run it in
strict mode, turning this rule off is reasonable — though note it will not catch the placeholder
case either.
