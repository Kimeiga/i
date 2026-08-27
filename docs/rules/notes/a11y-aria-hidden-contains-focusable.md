## Why it matters

`aria-hidden="true"` removes a subtree from the accessibility tree. It does not remove it from the
tab order. A keyboard user tabs into it and their screen reader goes silent: focus is somewhere, and
there is nothing to announce.

It is among the most disorienting failures there is, because the user's model of where they are on
the page simply stops being true. It usually arrives with a decorative wrapper, or with a modal that
is hidden from assistive technology but not actually closed.

`jsx-a11y/no-aria-hidden-on-focusable` checks the element carrying the attribute. This checks the
subtree beneath it, which is where the focusable thing usually is.

## How to fix it

Decide which you meant.

**Hidden from everyone** — use `hidden`, `display: none`, or unmount it. That removes it from the
tab order too.

**Hidden from assistive technology, still visible** — keep `aria-hidden` and take the contents out
of the tab order with the `inert` attribute, or `tabindex="-1"` on each focusable descendant.

`inert` is the right tool for the modal case and is supported in every current browser.

## What this rule will not catch

Focusable elements introduced at runtime inside the hidden subtree, and elements made focusable by
something other than an attribute this rule can read — `contenteditable`, or a component that
forwards `tabIndex` internally.
