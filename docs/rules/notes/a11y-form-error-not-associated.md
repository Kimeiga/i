## Why it matters

`aria-invalid` tells assistive technology the value is wrong. Without `aria-describedby` or
`aria-errormessage` pointing at the message, that is all it says. The user hears "invalid entry" and
has to guess what is wrong; sighted users read the red text under the field.

Nothing else lints this. `eslint-plugin-jsx-a11y` has no rule for it, and axe cannot report it
because a field with `aria-invalid` and no description is *valid* ARIA. It is a failure against
WCAG 3.3.1 Error Identification, not a markup error — one of the clearest examples of where a
validator's silence is not a pass.

## How to fix it

Give the message an element with an id and reference it:

```tsx
<input aria-invalid={Boolean(error)} aria-describedby={error ? 'email-error' : undefined} />
{error ? <p id="email-error">{error}</p> : null}
```

Render the message whenever the field is invalid, not only after a submit attempt, and keep
`aria-describedby` conditional so it never points at an element that is not in the document.

## What this rule will not catch

Fields that show an error without setting `aria-invalid` at all — visually red, semantically fine —
which is the more common version of the same problem and not detectable from markup. It also does
not check that the referenced id exists; the runtime rule `a11y/aria-valid-attr-value` does that.
