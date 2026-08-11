# r/webdev, r/nextjs, r/reactjs

Reddit punishes anything that reads like a launch. The post that works is a
finding, not a product.

**Read each subreddit's self-promotion rules first.** r/webdev has a Showoff
Saturday thread. r/nextjs is more tolerant of technical posts. r/reactjs removes
almost anything promotional.

**Disclose that you built it, in the post, early.** Being caught not disclosing is
worse than any amount of downvoting.

---

## r/nextjs — the strong post

Lead with the bug. The tool is a footnote.

> **PSA: a cached fetch with an Authorization header can serve one user's data to
> another**
>
> The Next.js Data Cache is keyed by URL and request options. It is not keyed by
> user. So this:
>
> ```ts
> const res = await fetch('https://api.example.com/v2/profile', {
>   headers: { Authorization: `Bearer ${token}` },
>   next: { revalidate: 3600 },
> })
> ```
>
> stores one visitor's profile where the next visitor's request finds it.
>
> It behaves perfectly in development, because there is one user and one token.
> It survives code review because both halves are individually correct — sending a
> credential is right, caching a slow request is right.
>
> Related, and the one that actually bit me: `'use client'` marks a *boundary*,
> not a file. Everything a client module imports also ships to the browser,
> however many hops away. So a shared helper with no directive in it becomes
> browser code, and any `process.env.SOMETHING` in it silently becomes `undefined`
> there. I found this exact shape in Next.js Commerce — `lib/utils.ts` reads
> `VERCEL_PROJECT_PRODUCTION_URL` and is reached from `components/cart/modal.tsx`,
> so `baseUrl` falls back to localhost in every browser.
>
> Things that check for this: nothing I could find, which is why I ended up
> writing a CI check for it. It is MIT and I will link it in a comment rather than
> the post, since the point here is the bug.

Then, in your own comment: one link, one sentence.

---

## r/webdev — Showoff Saturday

> **[Showoff Saturday] A CI check that reports what a PR changed about
> accessibility, instead of listing everything**
>
> Built this because every accessibility tool I tried gave me 400 findings on
> first run, which is the same as giving me zero.
>
> It reports the diff: three new violations in this component, this data crossed
> from session-scoped to shared-cache, +18KB of startup JS. Findings are
> fingerprinted without line numbers, so adding an import at the top of a file
> does not report everything below it as new.
>
> Accessibility detection is axe-core (Deque's, not forked). The part I wrote is
> static analysis of the React/Next client-server boundary.
>
> Honest limitations, since this is the part every tool in this space lies about:
> automated testing covers roughly a quarter to a third of WCAG success criteria.
> It cannot tell you whether alt text is *correct*. It does not make you
> compliant. I have a page listing what it cannot detect and I link it from the
> README.
>
> MIT, `npx @attestci/cli scan .`, no signup.

---

## r/reactjs — only if you have something genuinely React-shaped

> **`'use client'` marks a boundary, not a file — and the consequences are worse
> than I thought**
>
> Everything a client component imports is also in the client bundle. That is
> documented and everyone knows it in the abstract. What I did not internalise is
> that the *file with the problem in it* usually has no directive at all.
>
> <the import chain diagram and two real examples>
>
> I ended up building the import closure from every `'use client'` root to find
> these. One thing that turned out to matter a lot: **type-only imports have to be
> excluded**, or a `lib/types.ts` doing `import type { X } from './db/queries'`
> makes your whole database layer look browser-reachable. I shipped that bug and
> it reported a critical finding on completely correct code.

---

## Rules

- Never post the same text to three subreddits.
- Answer every technical question, ignore the rest.
- If a comment says your tool is wrong, check before replying. They are often
  right.
- No "check out my SaaS". No pricing link. No follow-up post.
