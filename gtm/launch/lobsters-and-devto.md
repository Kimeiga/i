# Lobsters and dev.to

Two different audiences and two different posts. Do not cross-post.

---

## Lobsters

Small, technical, allergic to marketing, and **you need an invite** — do not join
in order to post. If you are not already a member with history, skip this venue
entirely. Posting your own product as your first submission is the fastest way to
be remembered badly.

If you are a member: submit the **technical writeup**, not the product page.
Tags: `programming`, `javascript`, `web`.

Suitable subject matter:

- Building an import-graph closure over `'use client'` boundaries with the
  TypeScript compiler API, including why type-only imports must be excluded and
  what happens when you forget.
- Fingerprinting static-analysis findings so they survive unrelated edits — why
  excluding line numbers is the whole trick, and how occurrence indexes keep
  duplicate findings distinct.
- Content-hashing a report so two runs on different machines produce the same
  digest: what has to be excluded, and why canonical JSON is not optional.

Mention the product once, in the "authored by" note that Lobsters asks for. That
is it.

---

## dev.to

Tolerant, and correspondingly low-signal. Worth one genuinely useful article, not
a launch post. Canonical URL should point at your own site.

### Article: "Your Next.js cache is not keyed by user"

Structure:

1. **The bug**, in ten lines of code, before any preamble.
2. **Why it does not reproduce locally** — one user, one token, cache usually off.
3. **Why review misses it** — both halves are individually correct.
4. **The three fixes**, in order: do not cache the credentialled request; split
   the request into shared and per-user parts; cache per user in a store you
   control.
5. **How to find it in your codebase** — the grep that gets you 80% of the way,
   then a line about the tool for the rest.
6. **The limits** — what this does not cover: `unstable_cache`, CDN
   configurations that vary by cookie, your own caching wrappers.

Rules: no listicle, no "10 tips", no AI-generated filler, one product mention near
the end, and the grep has to actually work — a post that gives readers something
usable without the product is the only kind worth writing.

### Do not

- Publish more than one article a month. Volume is the failure mode on this
  platform and AI-generated volume is worse.
- Use the tag `#beginners` for this. Wrong audience.
- Post a "we launched" article. Nobody has ever read one.
