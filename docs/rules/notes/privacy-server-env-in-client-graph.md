## Why it matters

`'use client'` marks a boundary, not a file. Everything a client module imports is also shipped to
the browser, however many hops away. So the file that reads `process.env.INTERNAL_API_URL` usually
has no directive in it at all — it is an ordinary helper that became browser code because something
four imports up gained a `'use client'` line in an unrelated pull request.

The failure is silent in both directions. The bundler replaces the expression with `undefined`
rather than erroring, so a feature flag reads false forever and a base URL becomes the string
"undefined". Nobody gets a stack trace.

This is the rule that justifies building the import graph, and it is the clearest example of
something a per-file linter cannot do: the file is fine, its position is not.

## How to fix it

Read the variable on the server and pass the value down as a prop, or move the code that needs it
out of the client graph. If the value is genuinely not sensitive, prefixing it `NEXT_PUBLIC_` is a
legitimate fix — but it publishes the value to every visitor, so decide that on purpose rather than
to make an error go away.

The finding names the import chain from the `'use client'` boundary. Read it before deciding: often
the right fix is that the chain should not exist.

## What this rule will not catch

Only static `import` and `export … from` edges are followed. A dynamic `import()` with a computed
specifier is invisible. Modules inside `node_modules` are not traversed, so a value laundered
through a published package is missed. And a variable read through a computed access —
`process.env[name]` — cannot be resolved to a name at all.
