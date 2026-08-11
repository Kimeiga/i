# `a11y/label-association`

> Form control cannot be labelled

| | |
| --- | --- |
| Severity | serious |
| Layer | Static accessibility (source analysis) |
| Status | enabled by default |

## What it detects

A form control has no id, no aria-label, no aria-labelledby, no title, and is not wrapped in a label. Nothing in any file can associate a label with it, so its purpose is never announced and clicking the visible caption does not move focus to it. A placeholder does not count: it is removed as soon as the field has a value.

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

## Standards

| Framework | Reference | |
| --- | --- | --- |
| WCAG 2.1 | 1.3.1 (Level A) | [Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html) |
| WCAG 2.1 | 3.3.2 (Level A) | [Labels or Instructions](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html) |
| WCAG 2.1 | 4.1.2 (Level A) | [Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html) |

## Code that triggers it

`fixtures/a11y-static/label-association/triggering.tsx`

```tsx
export function SubscribeForm() {
  return (
    <form>
      {/* No id, no aria-label, not wrapped in a label: nothing can name it. */}
      <input type="text" name="email" placeholder="Email address" />
      <textarea name="notes" rows={4} />
      <button type="submit">Subscribe</button>
    </form>
  )
}
```

## Code that does not

`fixtures/a11y-static/label-association/clean.tsx`

```tsx
export function SubscribeForm({ inputProps }: { inputProps: Record<string, unknown> }) {
  return (
    <form>
      {/* Associated by id. */}
      <label htmlFor="email">Email address</label>
      <input type="text" id="email" name="email" />

      {/* Associated by wrapping. */}
      <label>
        Notes
        <textarea name="notes" rows={4} />
      </label>

      {/* Named directly. */}
      <input type="search" aria-label="Search orders" name="q" />

      {/* Spread props may carry a name; we cannot prove otherwise. */}
      <input type="text" {...inputProps} />

      {/* Labelled by its own value. */}
      <input type="submit" value="Subscribe" />
    </form>
  )
}
```
`fixtures/a11y-static/label-association/clean-wrappers.tsx`

```tsx
// Design-system wrappers. A capitalised name is a component, not a DOM element:
// it may set an id, forward a ref, or spread props we cannot see, and reporting
// it would accuse correct code of being broken.
//
// This fixture exists because a case-insensitive tag match reported 106 missing
// labels in one real repository, almost all of them on <Input> components that
// were labelled properly.

function Input(props: Record<string, unknown>) {
  return <input {...props} />
}

function Select(props: { children: React.ReactNode }) {
  return <select aria-label="Choose one">{props.children}</select>
}

export function AdminDialog({
  reason,
  setReason,
}: {
  reason: string
  setReason: (value: string) => void
}) {
  return (
    <form>
      <Input type="text" value={reason} onChange={(event) => setReason(event.target.value)} />
      <Select>
        <option>Duplicate</option>
        <option>Spam</option>
      </Select>
    </form>
  )
}
```

## How to fix it

Give the control an id and point a `<label htmlFor>` at it, or wrap it in a `<label>`. Where there
is genuinely no visible caption — a search field with a magnifying-glass button — use `aria-label`.

`useId()` is the right way to generate the id in a reusable component.

## How to suppress it

```ts
// attest-disable-next-line a11y/label-association -- why this instance is intentional
```

Or for a whole file:

```ts
// attest-disable-file a11y/label-association -- why this file is intentional
```

Or in `attest.config.json`, to turn the rule off everywhere:

```json
{
  "rules": {
    "a11y/label-association": "off"
  }
}
```

Suppressed findings are **recorded in the report**, with the reason you gave. That is deliberate: a suppression is a decision, and the evidence trail keeps decisions. It is not a way to make a finding disappear from the record.

---

_Automated tooling can evaluate roughly a quarter to a third of WCAG 2.1 success criteria. The rest — meaningful alt text, logical reading order, usable focus management, comprehensible error recovery — requires human judgement. Attest does not attempt them and does not report on them._

_Attest reports the results of automated checks. Automated testing detects only a subset of accessibility barriers. A clean Attest run is not a conformance claim, a legal opinion, or a substitute for testing with assistive technology and with disabled users. This is not legal advice._

<!-- Generated by scripts/generate-rule-docs.mjs. Edit docs/rules/notes/ instead. -->
