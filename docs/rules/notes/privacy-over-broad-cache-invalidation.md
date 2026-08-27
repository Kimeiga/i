## Why it matters

`revalidatePath('/', 'layout')` invalidates every cached route in the application. It is the reflex
fix for "my page did not update", it always appears to work, and it converts a cached site into an
uncached one — usually inside a server action that runs on every form submission.

Nothing fails. The site simply gets slower and the origin gets busier, in a way that shows up on the
infrastructure bill rather than in any test.

## How to fix it

Invalidate what changed: the specific paths, or a tag attached to the specific fetches.

When a narrow invalidation appears not to work, the cause is almost always a mismatch between the
path passed here and the route segment that actually rendered the data — a dynamic segment, a route
group, or a layout above the page. Widening the scope hides that mismatch rather than fixing it.

## What this rule will not catch

Only a literal `'/'` as the first argument. `revalidatePath(rootPath)` where `rootPath` is a
variable holding `'/'` is not reported, and neither is a tag that happens to be attached to every
fetch in the application, which has the same effect by a different route.
