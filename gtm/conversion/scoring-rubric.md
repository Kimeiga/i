# The offline page rubric

Implemented by `scripts/score-page.mjs`. Run by `pnpm lint:pages` and in CI.

## What it is for, and what it is not

**It is a rejection filter.** It catches the failures that are cheap to detect
and embarrassing to ship — a page with no limitation section, a CTA nobody can
measure, no explanation of how the product works, a wall of buzzwords.

**It is not a conversion predictor.** Nothing in it has been validated against a
single real visitor. A page scoring 93 is not more likely to convert than one
scoring 84; it is only less likely to be obviously broken. Treating the number as
a target is the same mistake as optimising for "sounds human", one level up — and
it would be a mistake made easy by the fact that the score is right there and
conversion data is not.

The clearest evidence that the score means little: the current pages score 84, 90
and 93, and the 84 is the page written for the most valuable traffic.

## Weights

| Dimension | Weight | What it actually measures |
| --- | --- | --- |
| Traffic and buyer match | 15 | A declared traffic source and a category eyebrow |
| Concrete problem or outcome | 10 | Concrete markers above the fold — file names, commands, units |
| Mechanism clarity | 10 | A section that shows how it works |
| Product specificity | 10 | Real paths named, not generic descriptions |
| Evidence and proof | 15 | Claim citations, and evidence linking to a report |
| Differentiation | 10 | Says what the alternative cannot do |
| Credibility and limits | 10 | States what it cannot do; publishes its own errors |
| CTA and offer congruence | 10 | Measurable, actionable, repeated |
| Scannability | 5 | Descriptive headings |
| Audience-native voice | 5 | Absence of buzzwords |

The last row is where the entire "does it sound human" question lives: **5 points
of 100.** A page can be perfectly human-sounding and still be vague, aimed at the
wrong buyer, or legally dangerous.

## Hard failures

These override the score entirely. A page with one of these is not a 71; it is
not shippable.

- Names no traffic source.
- No section states what the product cannot do.
- No section explains how the product works.
- Cites no claims at all.
- Primary CTA has no event name, so no experiment can read it.
- Buzzword density above 2 per 1,000 words.

## Two deliberate refusals in the implementation

**Attributed buzzwords do not count.** The pages characterise accessiBe's
marketing and the FTC's findings, which requires quoting the vendor's own
language. A buzzword inside a sentence that attributes it to somebody else is a
quotation, not a claim — the same reasoning as the `claims-ok` marker in
`check-forbidden-words.mjs`. The scorer flagged this as a false positive on its
first run and the fix went into the scorer, not the copy.

**The rubric was not tuned to flatter the pages it scores.** The home page loses
five points on "concrete problem or outcome" because its headline contains no
file name or command. That is a defensible criticism and it stands. Adjusting a
measure until your own work scores well is the failure this whole system is
built to avoid, and it is easiest to commit against yourself.
