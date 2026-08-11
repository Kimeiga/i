# Voice of customer

## The corpus is empty, and that is the largest gap in this system

There have been no sales calls, no support tickets, no lost-deal notes, no churn
reasons, no review-site comments and no user interviews, because there are no
users. Every sentence on the current site was written from the product
specification, which is exactly the failure mode the method warns against.

This file records that honestly rather than filling itself with invented
quotations. **A fabricated verbatim would be worse than an empty file**, because
it would then be laundered into copy, into the ranker's training features, and
eventually into a claim.

Anything below marked **[SYNTHETIC]** is a hypothesis to test, not evidence. No
page may cite it. `scripts/check-claims.mjs` has no way to enforce that, so it is
enforced by this sentence and by whoever reviews the next page.

---

## What we do have, and it is not nothing

Four sources of real language exist and are being used:

**1. Real findings on real codebases.** Three open source repositories scanned at
pinned commits, with the reports committed. This is genuine product truth: the
`lib/utils.ts` finding in `vercel/commerce` is a real sentence about a real file,
not a hypothetical. Claims C021 and C023.

**2. Our own false positives.** Two, found within an hour of pointing the scanner
at real code. That is the most honest thing the product has to say and it came
from evidence, not imagination. Claim C050.

**3. The objections that are structurally certain.** Not guesses about tone — the
questions this category *must* face, because the category has a decade of
overlay vendors behind it:

- Is this an overlay?
- Does it claim to make us compliant?
- Does my source code leave my machine?
- How much of WCAG does it actually cover?
- We already run axe. Why this?

Those are answerable from the product and from the public record, and they belong
on the page whether or not a customer has yet asked them.

**4. Primary regulatory sources.** The EAA text, EN 301 549, the FTC order. Read,
cited, and recorded in `docs/regulatory-context.md` with the four figures we
could not verify marked as such.

---

## The collection protocol, to start on the first day there is anyone to talk to

Every excerpt gets tagged and stored as JSON in `gtm/conversion/voc/`:

```json
{
  "source_id": "gh_issue_14",
  "speaker_role": "staff frontend engineer",
  "company_segment": "mid_market_eu_ecommerce",
  "type": "objection",
  "trigger": "procurement questionnaire",
  "verbatim": "…",
  "current_workaround": "…",
  "desired_outcome": "…",
  "proof_requested": "…",
  "used_in_claims": ["C0xx"]
}
```

Sources, in rough order of value for a pre-launch product:

| Source | Why it matters here |
| --- | --- |
| Replies to the accessibility-community post | The audience most likely to say the tool is wrong, which is the useful answer |
| GitHub issues on the OSS packages | Real usage, real friction, in the user's own words |
| Upstream maintainer replies to public-scan issues | Tells us whether findings read as useful or as noise |
| Show HN comments | Objections at their most direct |
| Questions after a scan report is shared | The gap between what we said and what was understood |
| Anyone who installs the Action and never runs it | The most valuable and hardest cohort to reach |

Rule: **the first ten of these rewrite the page.** Not "inform" it — rewrite it.
If ten real practitioners read the hero and none of them uses the words in it,
the words are wrong regardless of how well they scan.

---

## [SYNTHETIC] Hypotheses to test, not evidence to quote

Held here so the pre-traffic tests have something to falsify. Each is a guess.

- **[SYNTHETIC]** The trigger is external, not internal: a questionnaire, an
  article, or a complaint — not a developer deciding accessibility matters.
- **[SYNTHETIC]** The first objection is "is this an overlay", and it is asked
  silently. A visitor who suspects it leaves without asking.
- **[SYNTHETIC]** "We already use axe" is the most common dismissal, and the
  honest answer ("keep using it, we run it for you") is more persuasive than a
  differentiation argument.
- **[SYNTHETIC]** The privacy layer is more interesting to the buyer than the
  accessibility layer, but the accessibility layer is what they searched for.
- **[SYNTHETIC]** A page that admits its own false positives is trusted more than
  one that claims a low false-positive rate.

The fifth one is the most load-bearing assumption in the entire rewrite and the
one worth testing first — it is why the "what we got wrong" section is on the
landing page and not buried in a blog post.

---

## What would falsify the current positioning

Write this down now, while it is cheap:

- Practitioners say the import-graph findings are interesting but not something
  they would pay for → the privacy layer is a demo, not a wedge.
- Nobody can articulate what the product does after five seconds on the hero →
  the mechanism-first framing is too clever.
- Readers assume it *is* a compliance tool despite the page saying otherwise →
  the disclaimer is being read as legal boilerplate and needs to be structural,
  not textual.
- Everyone asks "so does it fix things?" → the report-only positioning is fighting
  the category's expectation and needs a different frame.
