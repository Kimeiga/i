# Tasks only the founder can do

Nothing in this file can be delegated, automated, or done by an AI. Each item is
either a legal question about his own circumstances or an account that must exist
in his name.

---

## Before Phase 1. Not before launch — before writing the product.

### Read your employment agreement

Specifically two clauses:

**IP assignment.** Many employment agreements assign to the employer any
intellectual property created by the employee during the employment, sometimes
regardless of whether it was created on company time or equipment, and sometimes
regardless of whether it relates to the company's business. If yours does, your
employer may own this code.

**Outside work / moonlighting.** Some agreements prohibit outside commercial
activity outright; some require written consent; some require disclosure only.

Some jurisdictions limit how far an employer can reach — California Labor Code
§2870 and similar provisions in other US states carve out work done entirely on
your own time without company resources and unrelated to the employer's business.
Others do not. **The default assumption should be that the agreement means what it
says until a lawyer tells you otherwise.**

Why this is first: if the answer is bad, everything built after this point may not
be yours to sell. This is a one-hour read and, if needed, a one-hour conversation
with an employment solicitor. It is the highest-value hour in the entire project.

If the answer is ambiguous, the usual remedies are a written consent or carve-out
from the employer, or incorporating and keeping strict separation of time and
equipment. Both are conversations you have before there is revenue to argue about,
not after.

---

## Before taking any money

- [ ] **Decide the legal entity.** Sole trader vs limited company. In the UK a
      limited company is cheap (~£50 to incorporate) and gives liability
      separation, which matters for a product with a regulatory adjacency.
- [ ] **Have a lawyer review the ToS, privacy policy and DPA templates** in this
      directory. Two hours of review, not a drafting engagement. Tell them the
      product reports automated accessibility checks and explicitly does not
      determine conformance — that distinction is the whole point and they need to
      preserve it.
- [ ] **Set up the Merchant of Record account** (Paddle or Lemon Squeezy). See
      [`mor-setup.md`](mor-setup.md). Requires identity verification and a bank
      account in your or the company's name.
- [ ] **Register the domain** and set up email. Not a personal Gmail address on
      the site.
- [ ] **Check business insurance.** Professional indemnity is the relevant kind
      for a product adjacent to a compliance obligation. Get a quote before you
      need it; premiums for a pre-revenue solo software product are usually small.

## Before publishing anything public

- [ ] **Verify the npm scope and GitHub organisation are yours.** `attest` is
      taken on npm (v1.0.1, published 2016). `@attestci` and `attest-ci` were
      unclaimed when checked on 11 August 2026. Claim both before announcing.
- [ ] **Check the trademark position** for the product name in the jurisdictions
      you will sell into. A basic search is free; a clearance opinion is not, and
      is probably not worth it pre-revenue — but discovering the conflict after
      the launch post is worse.
- [ ] **Read the accessibility community's norms** before posting there. See
      [`../launch/accessibility-community.md`](../launch/accessibility-community.md).

## Ongoing, and cannot be delegated

- [ ] **Decide whether to file each upstream issue** from a public scan. Automated
      filing is never appropriate; a real person has to judge whether the issue is
      welcome and whether the finding is right.
- [ ] **Answer anything that arrives claiming legal significance.** A customer
      asking "does this make us compliant" gets the honest answer, from you, in
      writing, every time. Never let a canned response answer that question.
- [ ] **Decline enterprise procurement.** Politely, in writing, quickly. See the
      anti-ICP section of [`../positioning.md`](../positioning.md).

---

## The spending cap

**$2,000 total** across APIs, hosting, domain, and MoR setup before paid retention
exists. That includes the lawyer's review, which is the item most worth the money.

If a decision would take you past it, stop and reconsider rather than spending. The
constraint is the point: a product that needs more than $2,000 to find out whether
anyone wants it has a distribution problem that money will not fix.
