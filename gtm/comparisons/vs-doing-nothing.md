# Attest vs doing nothing

**Short version: doing nothing is the right answer for a lot of teams, and we
would rather say so than sell you something you do not need.**

Most software is bought against inertia, and most comparison pages pretend inertia
is irrational. It usually is not. Here is an honest account of both sides.

## When doing nothing is correct

- **You do not sell into the EU or the UK**, no customer has asked about
  accessibility, and you are not in a regulated sector. There is no forcing
  function. Spend the time on something that is.
- **You have a dedicated accessibility team.** They own this, they have tools, and
  a check they did not choose is friction.
- **You already run axe in CI on every route with results tracked over time.** You
  have most of the accessibility half. Unless the privacy layer or the evidence
  trail is interesting to you, the marginal value is small.
- **You are pre-product-market-fit with three people.** The list of things more
  urgent than this is long and you know what is on it.
- **You have nobody who can act on the findings.** A report nobody fixes is worse
  than no report: it is a dated record of a problem you did not address, which is
  a materially worse position than not having looked.

That last one is worth sitting with. Once you scan, you know. If you are not going
to act, not knowing may genuinely be the better posture — and if that is your
situation, we would rather you did not buy this.

## What doing nothing actually costs

Not "you will be sued". Four specific things.

**Regressions compound silently.** The automatable subset is small, but it is
exactly the part that degrades every sprint: a label association broken by a
refactor, a wrapper that swallows a button, a `'use client'` added to fix a build
error. Nobody notices until somebody looks, and by then it is a project rather
than a pull request.

**Remediation under a deadline costs multiples.** Fixing as you go is minutes per
change. Fixing eighteen months of accumulated changes at once, with a regulator's
or a plaintiff's clock running, is a quarter of somebody's roadmap and a lawyer's
hourly rate on top.

**The privacy failures are not accessibility failures.** Session data in a shared
cache is a data breach, not a usability problem. It works perfectly in
development. The first time you find out is when a customer tells you they saw
somebody else's order.

**You cannot answer the question afterwards.** "When did you know, and what did
you do?" — from a regulator, a customer's security review, or opposing counsel. A
dated, hashed record of every scan and every decision is a good answer. Nothing is
not.

## The enforcement picture, honestly

The European Accessibility Act has applied since 28 June 2025. Enforcement varies
by member state and is not uniform.

What is documented: a French court ordered Carrefour in June 2026 to make its site
and app accessible within six months with a daily penalty past the deadline, after
action by disability associations. Norway's regulator has run a daily coercive
fine on a health portal since August 2025, and coercive fines accumulate with no
ceiling. Reported maximum penalties range from roughly €60,000 in Ireland to
roughly €900,000 in Sweden.

What we will not tell you: that enforcement is imminent for you specifically, that
any particular figure applies to your business, or that this tool changes your
legal position. See [regulatory context](../../docs/regulatory-context.md) for
sources, and for the four widely-quoted figures we could not verify and therefore
do not use. **None of it is legal advice.**

## The cheapest version of doing something

If you are not going to buy anything, do this — it is free and takes an afternoon:

```bash
npx @attestci/cli scan .
```

The CLI is MIT licensed, the whole rule set is in it, it sends nothing anywhere,
and there is no account. Add the GitHub Action, also free, and you get the pull
request comment. That is genuinely most of the value.

The paid tier is memory: history, trends, signed exports, org policy. If you never
need those, do not buy them. The free tier is not crippled and is not a trial —
that is a deliberate decision and the git history will show if it ever changes.

## The honest summary

Most teams should run the free tier and stop there. A team selling into the EU,
with a customer asking questions, or with an incident behind them, wants the
record — and that is what the paid tier is.

If you are not in one of those situations, doing nothing is a defensible choice
and this page is not going to argue you out of it.
