## Why it matters

The Next.js Data Cache is keyed by the request URL and its options. It is not keyed by user. A
response fetched with one visitor's bearer token and stored there is served to the next visitor
who triggers the same URL.

This is the failure mode that produces the incident report titled "customers saw each other's
orders". It cannot be reproduced in development, where there is one user, one token, and a cache
that is usually disabled. It survives code review because both halves look correct in isolation:
sending a credential is right, and caching a slow request is right.

Under the GDPR this is an unauthorised disclosure of personal data, and Article 33 gives you 72
hours to notify a supervisory authority once you become aware of it. The relevant word is *aware*.
A tool that reports the condition, dated and hashed, is materially better placed than one that
does not — which is the point of the evidence trail rather than the finding. This is not legal
advice; see [Article 33](https://gdpr-info.eu/art-33-gdpr/) for the primary text.

## How to fix it

Pick one of three, in order of preference.

**Do not cache the credentialled request.** `cache: 'no-store'`, or `next: { revalidate: 0 }`. If
the response is per-user, the shared cache is the wrong place for it and no configuration makes it
right.

**Split the request.** Most endpoints that need a token return a mix: a shared catalogue plus a
per-user entitlement flag. Fetch the shared part without the credential and cache it; fetch the
small per-user part uncached.

**Cache per user deliberately, in a store you control.** A cache keyed by user id in Redis is fine.
The Data Cache is not that, and cannot be made into it.

## What this rule will not catch

Only `fetch` calls where both the credential and the caching directive are visible on the same call
expression. It will miss a credential added by a wrapper function, a header object built elsewhere
and spread in, and any caching applied by a client library of your own. It says nothing about
`unstable_cache`, `React.cache`, or a CDN configured to cache responses that vary by cookie — the
last of which is the same bug one layer up, and one you have to look for yourself.
