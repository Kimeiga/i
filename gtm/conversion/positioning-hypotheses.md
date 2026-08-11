# Positioning hypotheses

Five mutually exclusive strategies. Not five phrasings of one strategy — that is
the AI average, and it is what the first landing page did: it opened with risk,
pivoted to mechanism, showed proof, and closed on evidence, so it argued four
positions and committed to none.

Each brief specifies audience, trigger, promise, mechanism, proof, objection,
limitation, CTA and the traffic where it should win. Three of the five are built
as complete pages. Two are recorded and not built, with the reason.

---

## H1 — Risk prevention

> **Stop accessibility regressions before they reach production.**

| | |
| --- | --- |
| Audience | Engineering manager who has just been asked about accessibility |
| Trigger | Procurement questionnaire, forwarded EAA article, complaint |
| Promise | The thing that is quietly getting worse stops getting worse |
| Mechanism | A check on every pull request |
| Proof | Real findings on known repositories |
| Objection | "Is this another compliance product that overpromises?" |
| Limitation | Automated testing covers a quarter to a third of WCAG 2.1 (C011) |
| CTA | Run it on your repository |
| Traffic | EAA-related search, problem-aware |

**Danger.** This is the framing closest to the sentence the FTC fined accessiBe
for. Every risk claim needs C063 attached and C011 above the fold. Built, at
`/for/eaa`, with the regulatory scope stated before the product pitch rather than
after it.

---

## H2 — Mechanism

> **`'use client'` marks a boundary, not a file.**

| | |
| --- | --- |
| Audience | Staff frontend engineer who already knows Next.js well |
| Trigger | Curiosity; a bug they have personally been bitten by |
| Promise | A class of bug you cannot see becomes visible |
| Mechanism | The client import graph — whole-program, not per-file |
| Proof | The `vercel/commerce` finding (C021), reproducible at a pinned commit |
| Objection | "ESLint already does this" — answered by the mechanism itself |
| Limitation | React and Next.js only; type-only imports excluded (C020) |
| CTA | Run it on your repository |
| Traffic | Show HN, Lobsters, r/nextjs, developer word of mouth |

**Why this is the default.** It is the only claim on the list that no competitor
can make, it is verifiable in thirty seconds by anyone who doubts it, and the
audience that finds it interesting is the audience that installs things. Built as
the primary landing page.

---

## H3 — Proof and speed

> **Point it at your repository. Thirty seconds, no account.**

| | |
| --- | --- |
| Audience | Someone already on the GitHub Marketplace listing |
| Trigger | Browsing for a CI check |
| Promise | You will know whether this is useful before you commit to anything |
| Mechanism | Local CLI, no signup, nothing transmitted (C040) |
| Proof | The visitor's own codebase — the strongest proof available |
| Objection | "How long will this take to evaluate?" |
| Limitation | Runtime accessibility needs a browser and a running app |
| CTA | `npx @attestci/cli scan .` |
| Traffic | GitHub Marketplace, solution-aware |

Built at `/for/github`. The lowest-commitment path, and the one where the CTA
*is* the proof.

---

## H4 — Replacement / comparison

> **You already run axe. This runs it every time, and remembers.**

Recorded, **not built**. Two reasons.

It concedes the frame to axe on a page whose job is to establish an independent
reason to exist, and the honest version of the argument — most of the
accessibility half is available free from Deque — talks a meaningful share of
qualified visitors out of installing. That is the correct thing to say in a
[comparison page](../comparisons/vs-axe-devtools.md), where the reader arrived
already comparing. It is the wrong thing to lead with.

Test it later as a challenger. It may well win on branded search, where the
visitor already knows both products.

---

## H5 — Evidence and audit trail

> **Every check, every waiver, every date — preserved and verifiable.**

Recorded, **not built as a landing page**, for one disqualifying reason: the
hosted evidence store is not deployed (P002). A page leading with the trail would
be selling something nobody can buy.

The trail still appears as a *section* on the built pages, described accurately
as how the reports work locally — content hashing and recorded suppressions are
real today in the CLI (C030, C031). The hosted history is not.

This becomes the strongest hypothesis the day the API ships, and it is probably
the one that eventually justifies the price. Not yet.

---

## What is being tested first

| | Page | Traffic | Hypothesis |
| --- | --- | --- | --- |
| Control | `/` | all | H2 mechanism |
| Challenger | `/for/github` | GitHub Marketplace | H3 proof |
| Challenger | `/for/eaa` | EAA search | H1 risk |

These are not an A/B test of each other — they serve different traffic, and
comparing them directly would measure the traffic, not the page. The first real
experiment is defined in `experiments/exp-001.yaml` and pits H2 against H3 on the
*same* source.
