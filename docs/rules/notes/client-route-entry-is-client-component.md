## Why it matters

`'use client'` at the top of `page.tsx` moves the whole component subtree below it into the browser
bundle, including every component that would otherwise have rendered on the server and shipped no
JavaScript at all.

It is a one-line change with a large, invisible cost, and it is usually added to fix a single
`useState` that could have lived in a leaf component instead.

## How to fix it

Move the directive down to the smallest component that needs browser state or browser APIs, and keep
the page or layout on the server. A page that renders `<TabSwitcher />` where only `TabSwitcher` is
a client component ships the interactive part and nothing else.

## What this rule will not catch

Nothing here says how *much* the bundle grew — for that, point `--build-dir` at your `.next`
directory and the client-impact section of the diff will report the byte delta per route.

If the route genuinely is an interactive application, this finding is the expected cost of that
decision. Suppress it with a reason; the reason is what the next person needs.
