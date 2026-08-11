## Why it matters

An icon-only button announces as "button". A row of them announces as "button, button, button". The
user is told there are three controls and nothing about what any of them do, which in a data table
means the difference between archiving a record and deleting it.

axe catches this at runtime and catches it better, because it computes the real accessible name from
the rendered DOM. This rule exists to catch it in the pull request that introduces it, on a component
that may not be reachable from any URL your CI job renders.

## How to fix it

Add an `aria-label` describing the action — the action, not the icon. "Delete row", not "trash can".

Mark the icon `aria-hidden="true"` so it is not announced twice, and prefer visible text where the
layout allows it: a labelled button helps everyone, including sighted users who do not recognise
the glyph.

## What this rule will not catch

It reads the children it can see. A control whose text comes from a variable, a translation
function, or a child component that renders text is treated as unknown and not reported — dynamic
content is invisible to source analysis, and guessing would produce false positives on the majority
of real components.
