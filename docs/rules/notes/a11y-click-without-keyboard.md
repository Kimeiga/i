## Why it matters

A click handler on a `<div>` is invisible to the keyboard: no focus, no Enter, no Space. Nothing
about it is broken for the person who wrote it, which is why it survives review and ships.

For a keyboard user, a switch user, or a voice-control user, the feature does not exist. Not
degraded — absent.

## How to fix it

Use a `<button>`. It gets focus, Enter, Space, the correct role, and the platform's own focus ring,
and it is fewer lines than doing it manually. `all: unset` on a button gets you a `<div>`'s
appearance without giving up any of that.

If the element has to stay a `<div>` — a table row that is also a link, say — you need all three:
`role`, `tabIndex={0}`, and an `onKeyDown` that responds to Enter and Space.

## What this rule will not catch

Only raw DOM elements. `<Card onClick={…} />` is not reported, because the component may handle
keys internally and there is no way to tell from here. Elements with spread props are skipped for
the same reason.

`jsx-a11y/click-events-have-key-events` and `no-static-element-interactions` cover similar ground.
This rule differs in ignoring elements that already carry both an interactive role and a tab stop
plus key handling, which cuts the false positives on design systems that do the pattern correctly.
