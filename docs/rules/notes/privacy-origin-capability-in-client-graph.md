## Why it matters

Next.js already errors when a client component imports `server-only` directly, and we do not claim
credit for that case. The one it does not warn about early is transitive: a helper that imports
`@prisma/client` alongside a harmless string formatter becomes browser-bound the moment anything
above it gains a `'use client'` directive.

What follows is a bundler error nobody can read, or — worse, when the module resolves to a browser
shim — a bundle quietly carrying a database driver's polyfills.

## How to fix it

Split the module. Keep the capability in a file no client module imports, and expose what the
browser actually needs through a server action, a route handler, or props.

The usual shape of this bug is a `lib/db.ts` that exports both `pool` and a pure `formatRow`
helper. Move the helper to its own file and the problem disappears without touching either caller.

## What this rule will not catch

The list of capabilities is a list. A server-only module of your own with an unremarkable name is
not on it, and neither is a package published after this list was written. Adding a project-specific
entry is not currently configurable, which is a real limitation.
