# Legal and admin scaffolding

**Every document in this directory is a template. None of it has been reviewed by
a lawyer. None of it is legal advice.** They exist so that the founder's
conversation with a solicitor is a two-hour review rather than a from-scratch
drafting engagement, which is the difference between roughly £500 and roughly
£5,000.

Do not publish any of them without that review.

## Contents

| File | What it is | Before launch |
| --- | --- | --- |
| [`terms-of-service.md`](terms-of-service.md) | Template ToS | Lawyer review |
| [`privacy-policy.md`](privacy-policy.md) | Template privacy policy | Lawyer review; must match what the code actually does |
| [`dpa.md`](dpa.md) | Published, non-negotiable DPA | Lawyer review |
| [`subprocessors.md`](subprocessors.md) | Subprocessor list | Keep current; it is referenced by the DPA |
| [`disclaimers.md`](disclaimers.md) | The standard blocks used everywhere | Lawyer review of the wording |
| [`mor-setup.md`](mor-setup.md) | Merchant of Record checklist | Do it before taking money |
| [`founder-only-tasks.md`](founder-only-tasks.md) | **Things only he can do** | **Read this first** |

## Start with `founder-only-tasks.md`

One item on it — reviewing his own employment agreement for IP assignment and
outside-work clauses — has to happen **before Phase 1**, not before launch. If his
employer owns this code, everything after that point is wasted effort, and it is
the cheapest possible thing to check.

## Two decisions that remove most of the legal surface

**Merchant of Record, not raw Stripe.** Paddle or Lemon Squeezy becomes the legal
seller of record and handles VAT, GST and sales tax remittance in every
jurisdiction. This removes 40+ tax registrations from a founder who cannot hire an
accountant. See [`mor-setup.md`](mor-setup.md). Do not build custom tax logic. Do
not use bare Stripe.

**A published, non-negotiable DPA.** Negotiating a DPA means paying a lawyer per
customer. Publishing one, at a stable URL, self-serve, means the answer to "can we
send you our DPA?" is "here is ours, we do not negotiate it" — which loses the
deals that were going to be unprofitable anyway.

## The single most important paragraph

In [`disclaimers.md`](disclaimers.md), and it appears in the ToS, in every report,
in every export, in the CLI, and on every docs page:

> Attest reports the results of automated checks. Automated testing detects only a
> subset of accessibility barriers. A clean Attest run is not a conformance claim,
> a legal opinion, or a substitute for testing with assistive technology and with
> disabled users. This is not legal advice.

It is not removable from any product surface. That is enforced in code, not by
convention: `scripts/check-forbidden-words.mjs` fails the build if a surface
drifts past the canonical claim, and the disclaimer is emitted from a constant
every renderer reads.
