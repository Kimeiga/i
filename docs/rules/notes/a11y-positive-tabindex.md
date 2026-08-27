## Why it matters

Any positive `tabindex` pulls its element to the front of the document's tab order, ahead of
everything with `tabindex="0"` — including elements added later by someone who has no idea this
exists.

The resulting order is invisible in the markup, cannot be reasoned about locally, and breaks the
first time anyone adds a field. It is almost always an attempt to fix an ordering problem that would
be better fixed by moving the markup.

## How to fix it

Use `tabIndex={0}` and put the element where it belongs in the DOM. If the visual order needs to
differ from the source order, do that with CSS — but note that a large mismatch between visual and
DOM order is itself a WCAG 2.4.3 problem, so this usually means the markup is wrong.

`tabIndex={-1}` is fine and different: it means "focusable by script, never by tabbing", which is
what you want for a status region you move focus to.

## What this rule will not catch

Nothing beyond a literal positive number. `tabIndex={props.order}` is not resolved.

`jsx-a11y/tabindex-no-positive` covers exactly this. If you run it, turning this rule off is
reasonable — the overlap is complete.
