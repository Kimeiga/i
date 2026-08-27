## Why it matters

On a serverless runtime the execution context is frozen or destroyed once the response is returned.
Work the response did not wait for therefore runs *sometimes*: on a warm instance handling another
request it completes, on a cold one it disappears.

The resulting bug report is "some receipts never send", with no error, no log line, and no pattern —
which is the most expensive shape a bug can have.

Floating promises in general are a style question with a well-known ESLint rule. Floating promises
*in a request lifecycle* are a correctness question, which is why this rule is scoped to route
handlers and `'use server'` modules rather than to all code.

## How to fix it

Await the work before returning. If it is slow enough that awaiting it hurts, that is a signal it
belongs somewhere else: a queue, a scheduled job, or the platform's own background-work primitive
(`waitUntil` on runtimes that provide it).

If dropping the result really is intentional, mark it `void someCall()` so the intent is visible to
the next reader, and suppress the finding with that reason.

## What this rule will not catch

Timers and calls to functions this project declares `async`. A promise returned by an imported
library function is not resolved to a declaration, so it is not reported. Work scheduled indirectly
— through an event emitter, a `.then()` chain assigned to a variable, or a fire-and-forget wrapper
of your own — is missed.
