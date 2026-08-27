# The conversion-page system

A production and learning system for landing pages, not a prompt and not a
copywriting style. It exists because the first landing page here was written the
way most AI-assisted pages are written — describe the product, ask for something
persuasive, make it sound human — and that produced a page that argued four
positions, led with a mockup instead of its real evidence, and shipped a buy
button for something nobody can buy.

## The doctrine

> Truth before copy. Strategy before wording. Whole pages before headlines.
> Qualified activation before clicks. Profit before activation. Real buyers and
> randomised outcomes before model judgement.

## The order of operations

| Phase | Artefact | Enforced by |
| --- | --- | --- |
| 0 · Objective | [`objective-contract.yaml`](objective-contract.yaml) | Read before writing anything |
| 1 · Product truth | [`claims.yaml`](claims.yaml) | `scripts/check-claims.mjs` |
| 2 · Customer language | [`voice-of-customer.md`](voice-of-customer.md) | **Currently empty — the largest gap** |
| 3 · Strategy | [`positioning-hypotheses.md`](positioning-hypotheses.md) | Every page declares its `hypothesisId` |
| 4 · Whole pages | `apps/web/content/pages/*.json` | `assertPageSpec` at build |
| 5 · Rejection filter | [`scoring-rubric.md`](scoring-rubric.md) | `scripts/score-page.mjs` |
| 6 · Rendered review | The built site | `attest scan --url` in CI |
| 7 · Pre-traffic tests | [`pre-traffic-tests.md`](pre-traffic-tests.md) | Not yet run |
| 8 · Live experiment | [`experiments/`](experiments/) | Not yet run — no traffic |
| 9 · Ranker | — | **Deliberately not built.** See below |

## Where the discipline actually lives

Three checks run on every commit and none of them is about wording:

**`check-claims.mjs`** — every substantive block on a page cites claim ids from
`claims.yaml`. The build fails on an unknown id, a prohibited claim, a *pending*
claim described as though it exists, and a regulatory claim without the "not
legal advice" companion. It also verifies that each claim's evidence path is a
real file in this repository, so "status: verified" cannot be an assertion.

This caught a real problem in the first draft of the rewrite: an FAQ answer
described the hosted service without saying it is not yet deployed. The fix was
the copy, not the check.

**`score-page.mjs`** — a rejection filter with hard failures that override the
score. A page with no limitation section, no measurable CTA, or no explanation of
how the product works is not a 71; it is not shippable. The score itself predicts
nothing about conversion and must never become a target.

**`check-forbidden-words.mjs`** — the pre-existing phrase check, unchanged.

## Four things this system deliberately does not do

**It does not train a ranker.** Not on zero visitors, zero experiments and three
pages. A pairwise XGBoost model over page features is the right eventual tool and
the wrong current one: with no randomised outcomes it would learn the aesthetic
of whichever pages happen to exist, then be cited as evidence for them. The
threshold for starting is written down — several hundred pairwise judgements
across independent page groups, with grouped hold-out by company and campaign,
and randomised business outcomes gradually replacing subjective labels. We are
three orders of magnitude away.

**It does not optimise "sounds human".** The humanisation idea is a late-stage
guardrail at most. A page can be perfectly human-sounding and still be vague,
unconvincing, aimed at the wrong buyer, or legally dangerous — and landing pages
legitimately use fragments, parallel headings and repeated CTA language that a
prose detector would score as suspicious. In the rubric this is worth 5 points of
100.

**It does not rebuild the site in SvelteKit.** Structured page data was the
valuable half of that suggestion and it is implemented; the framework half would
break something load-bearing. Attest's own site is scanned by Attest on every CI
run, all four layers, as a self-demonstration — and Attest's static analysis only
supports React and Next.js. Moving the site to Svelte would mean the accessibility
tool could no longer check its own marketing site, which is a strange thing to
trade for a nicer authoring experience.

**It does not adopt the recommended model stack as given.** Role separation is
right — the model that writes a page should not be its only judge, evaluators
should see variants blind, and at least one critic should be told to reject the
positioning rather than politely improve it. All of that is in the process. The
specific model names, prices and benchmark figures in the brief are things this
repository cannot verify, and per its own rules unverifiable figures do not get
repeated as fact. They are recorded, attributed, and unused.

## What is actually true about the rewrite right now

Nothing has been published. There is no traffic. No practitioner has read either
version. Every change is a hypothesis with a written reason, and
[`/compare`](../../apps/web/app/compare/page.tsx) says so on the page itself.

The next step is not another rewrite. It is
[`pre-traffic-tests.md`](pre-traffic-tests.md), which costs a few hours and can
falsify most of this.
