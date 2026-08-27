# Show HN

Post the accessibility-community version first, and fix whatever it surfaces
before coming here.

**Timing:** Tuesday to Thursday, 08:00–10:00 ET. Be present for the first four
hours; the comments are the post.

**Title** (80 char limit, no "we", no hype):

> Show HN: Attest – CI check that reports what a PR changed about a11y and privacy

Alternatives:

> Show HN: Catch session data leaking into Next.js's shared cache in CI
> Show HN: A semantic diff for accessibility and privacy regressions

The first is honest about scope. The second leads with the most interesting
finding, which is the better HN instinct — HN rewards a specific technical thing
over a category.

---

## Body

> I have been building a CI check for React and Next.js codebases that reports
> what a pull request *changed* about accessibility and privacy behaviour, rather
> than a list of everything wrong.
>
> The accessibility half runs axe-core (Deque's, unmodified) against rendered
> pages. That part is not novel and I do not claim it is.
>
> The half I have not seen elsewhere is static analysis of the client/server
> boundary. Two examples of what it finds:
>
> **Session data entering a shared cache.** A `fetch` that sends a bearer token
> and also says `next: { revalidate: 3600 }` puts a per-user response into the
> Next.js Data Cache, which is keyed by URL and shared across every visitor. It
> works perfectly in development, where there is one user.
>
> **Server values reaching the browser through an import chain.** `'use client'`
> marks a boundary, not a file — everything a client module imports also ships.
> Scanning Next.js Commerce, it found `lib/utils.ts` (no directive in it) reading
> `process.env.VERCEL_PROJECT_PRODUCTION_URL` and reaching the browser via
> `components/cart/modal.tsx`. In the client bundle that expression is `undefined`,
> so `baseUrl` silently falls back to localhost. No error, no warning.
>
> A per-file linter cannot find either. Nothing about `lib/utils.ts` is wrong; its
> *position in the import graph* is.
>
> Two things I would rather say myself than have found:
>
> Automated tooling covers roughly a quarter to a third of WCAG success criteria.
> That is the ceiling for the category, not a roadmap item. It does not make
> anyone compliant, there is a CI check in my own repo that fails the build if my
> docs ever claim otherwise, and there is a page listing what it cannot detect
> that I link from the README and the CLI help.
>
> And running it against three real repos found two false positives in my own
> rules, one of which — treating `<Input>` as `<input>` because the tag match was
> case-insensitive — reported 106 phantom findings in a codebase with a design
> system. Both are written up on the public scan pages with before/after numbers.
>
> MIT licensed, `npx @attestci/cli scan .`, no account. I plan to charge for
> hosted history later.
>
> Repo: <link>. Public scans of vercel/commerce, vercel/ai-chatbot and documenso,
> with the raw reports: <link>.

---

## Comments to prepare for

**"This is just axe with extra steps."**
> Half of it is axe, and I say so — Deque's detection is better than anything I
> would write. The half that isn't is the static client/server boundary analysis,
> which axe structurally cannot do because it evaluates a rendered DOM. The Data
> Cache example is the clearest case.

**"Accessibility overlays are a scam."**
> They are, and this is not one. No script tag, no runtime modification, nothing
> injected into your site. In January 2025 the FTC fined accessiBe $1M for claiming
> its AI could make sites conform to WCAG. My repo has a CI check that fails the
> build if my own marketing drifts toward that language.

**"Why not just an ESLint plugin?"**
> Three of the four layers could not be. The client graph analysis needs a
> whole-program view — the file with the bug is fine, its position isn't. The
> runtime accessibility layer needs a browser. And the evidence trail — dated,
> hashed, append-only — is not a thing ESLint has a place to put.

**"What is your false positive rate?"**
> I do not have a number I would defend, so I am not going to invent one. What I
> have: every rule ships with code that must trigger it and code that must not,
> both run in CI, and the public scan pages document every false positive found so
> far with the before/after counts. Two so far, both fixed, both with regression
> fixtures.

**"Is the free tier going to disappear?"**
> The CLI, all 30 rules and the Action are MIT and stay MIT. The paid part is
> hosted history, evidence export and org policy. If I ever move a rule behind a
> paywall the git history will show it and you can fork the commit before.

**"$299/month is a lot."**
> For one developer it is. It is priced for a team where somebody will otherwise
> spend a week on a remediation project. If it is not worth that to you, the free
> tier is the whole tool and is not crippled.

---

## Do not

- Reply defensively. Concede the good points immediately.
- Reply to every comment. Reply to the substantive ones.
- Post it yourself in other threads.
- Ask anyone to upvote.
