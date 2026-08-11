# Outreach

**There is no sequence, no cadence, and no CRM.** If a lead needs five touches
they need a salesperson, and there is not one and will not be one.

These templates are for the rare case where a specific person, in a specific
situation, would genuinely benefit from one message. Not a channel. A handful of
messages a month at most.

## Rules

1. **Self-serve first.** Every message ends by pointing at something they can do
   without talking to you. If the message would work as a docs link, send the docs
   link.
2. **One message. No follow-up.** Silence is an answer.
3. **Never mention legal risk.** Not the EAA, not penalties, not lawsuits. That is
   how overlay vendors sell and it is the reason nobody trusts them.
4. **Never cold-email about their production site.** Ever. See the hard rules in
   [`../public-scans/README.md`](../public-scans/README.md).
5. **Only contact people who have already engaged** — starred the repo, installed
   the Action, commented on a scan page, replied to a post, filed an issue.
6. **If they say no, say thank you and stop.**

---

## They installed the Action and it has been running a week

Only if you can see something specific and useful. Otherwise do not send it.

> Subject: attest on <repo>
>
> Hi <name> — I noticed <repo> has been running Attest for about a week. I am the
> person who builds it.
>
> Not selling you anything: I would like to know whether the findings were useful
> or noisy. Specifically, did any of them turn out to be wrong? False positives are
> the thing I care most about and the thing I am least able to find on my own.
>
> If it has been useful, the free tier stays free — the CLI and Action are MIT and
> that is not changing.
>
> Either way, thanks for trying it.

No pricing link. No feature list. The question is real.

---

## They asked a question publicly that the paid tier answers

> Hi <name> — saw your question about tracking accessibility findings over time.
>
> The free CLI writes a JSON report; committing those to a repo gets you a
> workable history for nothing, and the content hashes still verify. That is
> genuinely how I would do it if I did not want another subscription.
>
> If you would rather not maintain that, the hosted tier does it with trend
> tracking and signed exports: <link>. $49/repo/month, self-serve, cancel from
> settings.
>
> Happy to answer anything either way.

The free workaround comes first, and it actually works. A message that hides the
free option to sell the paid one is a message that gets you remembered badly.

---

## Inbound from a large company

The reply that saves everyone time.

> Hi <name> — thanks for getting in touch.
>
> I should be upfront: Attest is run by one person. There is no sales process, no
> SOC 2, no custom contracts, and I do not negotiate the DPA — everything is
> self-serve at <pricing link>, and the DPA is published and accepted by use.
>
> If your procurement needs more than that, we are not a good fit, and I would
> rather tell you now than after a month of back-and-forth. No hard feelings — the
> CLI and Action are MIT licensed and are the whole tool, so your team can use
> those with no relationship with me at all.
>
> If self-serve works, Team is $299/month for up to 10 repositories and takes about
> five minutes to set up.

Send this early. The deal that needs procurement is the deal that costs more than
it pays.

---

## A maintainer replied to a public scan

> Thanks for taking a look. Two things:
>
> If any of those findings are wrong, I would really like to know which — I have
> already had to fix two false positives found this way and I would rather hear
> about the third from you than not hear about it.
>
> And if the icon-button labels would be a welcome pull request, I am happy to open
> one. If drive-by contributions are not useful to you right now, that is a
> completely fine answer and I will leave it.

No product mention at all. This is the relationship that matters most and it is
worth nothing if it is a sales channel.

---

## Never send

- Anything to a company's sales, legal, or support address about their website.
- Anything mentioning penalties, the EAA, lawsuits, or exposure.
- Anything to someone who has not engaged first.
- A second message.
- Anything you would be annoyed to receive.
