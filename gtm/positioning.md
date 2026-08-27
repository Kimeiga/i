# Positioning

## The canonical claim

Used verbatim. It is the outer boundary of what the product may say about
itself, it lives in `packages/core/src/product.ts` as `CANONICAL_CLAIM`, and CI
fails the build when any surface drifts past it.

> Attest owns the automatable subset of accessibility conformance, proves it does
> not regress, and produces the evidence trail. It does not make you compliant,
> and no tool can.

Do not soften "does not make you compliant". Do not add a qualifier that implies
an exception. The underclaim *is* the position.

## One-liner

Attest is a deterministic CI check that catches accessibility and
privacy-boundary regressions in React and Next.js codebases, and produces a
timestamped evidence trail you can hand to a regulator.

## Who this is for

**Engineering managers and staff frontend engineers at companies with 20–500
people, selling into the EU, running React or Next.js, with no dedicated
accessibility team.**

Every clause is doing work:

- **20–500 people** — big enough that regressions outpace anyone's memory, small
  enough to buy something with a credit card.
- **Selling into the EU** — the European Accessibility Act has applied since 28
  June 2025 and enforcement is live. Without that pressure this is a nice-to-have.
- **React or Next.js** — the static privacy and placement rules only work here.
  This is the whole reason the tool is worth more than a generic scanner.
- **No dedicated accessibility team** — with one, they already own this and have
  tools. Without one, the accessibility work lands on whoever is nearest, and
  that person wants a check that tells them when they broke something.
- **Engineer or engineering manager, not compliance** — the buyer installs a
  GitHub Action. If the buyer is in a compliance function, they want a platform
  and an audit, and that is not this.

The trigger event is almost always one of three: a customer's procurement
questionnaire asked about accessibility, someone forwarded an article about the
EAA, or a complaint arrived.

## Explicit anti-ICP

Say no to these. Each one costs more than it pays.

**Enterprises with procurement.** Security questionnaires, redlined MSAs,
negotiated DPAs, vendor onboarding portals. A $30,000 deal that needs a legal
department costs more than a legal department. Point them at the Team tier and
self-serve checkout; if they insist on procurement, decline politely.

**Agencies wanting white-label.** They want your product under their brand, their
support burden routed to you, and their margin taken out of your price.

**Anyone asking for a compliance guarantee.** There isn't one. A customer who
buys believing there is will be an angry customer later, and their belief is the
thing that creates liability. Send them the limits page before they pay.

**Anyone asking for an overlay, a widget, or a "fix it automatically" button.**
Not a roadmap item. Not ever. Say why.

**Vue, Svelte, Angular, Rails, WordPress, plain HTML.** The runtime accessibility
layer would work; the layer worth paying for would not.

**Single large prospects with a feature list.** Building their list makes them
your product manager and every other customer's product a worse fit.

## The three objections, answered honestly

### "We already use axe."

Good. Keep using it — we run it for you, unmodified, and credit Deque for it.

Three things you do not get from axe alone:

**It runs when someone remembers.** A browser extension is a manual step, and
manual steps get skipped in the sprint where they matter. This runs on every pull
request and tells you what *changed*, not what exists.

**It has no memory.** axe tells you the state today. It cannot tell you that a
component regressed three weeks ago, when, or in which commit — and it produces
no record that a regulator or a customer's auditor will accept.

**It cannot see the privacy layer.** axe evaluates a rendered DOM. It has no
opinion about a `fetch` that sends a bearer token and asks to be cached in a
store shared by every visitor. Neither does ESLint. That class of bug fails
silently in development and is found in production, by a customer.

If you run axe in CI already, on every route, with results tracked over time,
you have most of the accessibility half. Buy this for the other half or don't buy
it.

### "Our designer handles this."

Then your designer handles the part that is design: colour, hierarchy, focus
states, copy. That is real work and this tool does not do it.

It does not handle the part that is code. A label association broken by a
refactor, an `aria-hidden` wrapper that swallows a button, a `'use client'`
directive that drags a database driver into the browser — none of those are
visible in Figma, and none survive a design review, because they are introduced
after it.

The question to ask is not whether someone owns accessibility. It is who finds
out when it breaks, and how long it takes.

### "We'll deal with it if we get a letter."

That is a real strategy and sometimes the right one. Two things to weigh.

Remediation under a deadline costs multiples of remediation as you go, because
you are fixing months of accumulated changes at once, with a lawyer's clock
running.

And the letter is not the only trigger. In June 2026 a French court ordered
Carrefour to make its site and app accessible within six months, with a daily
penalty past the deadline, after being taken to court by disability
associations — not after a warning letter. Norway's regulator has been running a
daily coercive fine on a health portal since August 2025; those accumulate with
no ceiling. See [regulatory context](../docs/regulatory-context.md) for sources
and for what we could not verify.

If you do wait, the thing you will want is a dated record of what you knew and
what you did. That is the part of this product that is worth the money.

## Why we win, when we win

Not on detection. axe is better at detection than anything we would write, which
is why we run axe.

We win on three things:

1. **The diff.** Not a list of problems — a statement of what *changed*. Nobody
   acts on a list of 400 findings. Everybody acts on "this PR added three."
2. **The privacy layer.** Session data entering a shared cache, server values
   reaching the browser through a five-hop import chain, effects repeated under
   retry. No accessibility tool looks at it, ESLint cannot see across the import
   graph, and every one of them fails silently in development.
3. **The evidence trail.** Content-hashed, append-only, with suppressions and
   their reasons kept in the record. This is the thing a regulator, an auditor,
   or a customer's security review actually asks for, and it is the thing that
   makes the subscription worth renewing after the first clean-up is done.

## Where we lose, and should

- Against **Siteimprove and Level Access** for enterprise governance: multi-team
  dashboards, procurement, contracts, an account manager. They should win those.
- Against **a manual audit** for anything requiring judgement. We say so on the
  limits page and recommend buying one.
- Against **doing nothing** for a team not selling into a regulated market with
  no complaint and no procurement pressure. There is no urgency and we should not
  manufacture one.

## Words we do not use

Enforced by `scripts/check-forbidden-words.mjs`, which fails the build. The
authoritative list is `FORBIDDEN_CLAIM_PATTERNS` in
[`packages/core/src/product.ts`](../packages/core/src/product.ts); it covers
"compliant" as a state we deliver, claims of certification or guarantee, absolute
coverage claims, and the phrasings the FTC found deceptive in the accessiBe
matter.

Read the constant rather than maintaining a second copy of the list here — a
duplicated list is a list that drifts, and this one is a legal control.

In January 2025 the US Federal Trade Commission ordered accessiBe to pay
$1,000,000 over claims that its AI overlay could make any website conform to WCAG
2.1 AA. That is the exact failure mode. Our defensibility comes from
underclaiming, and the check exists so that a rushed edit to a landing page at
11pm cannot quietly cost that.
