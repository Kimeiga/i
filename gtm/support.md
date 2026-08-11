# Support

The whole system, and the reason it is this small.

## What exists

| Channel | For | Response |
| --- | --- | --- |
| [Docs](https://attest.ci/docs) | Everything, first | Immediate |
| GitHub issues | Bugs, rules, false positives | Best efforts, publicly |
| `support@attest.ci` | Billing, account, anything private | Best efforts |
| Public changelog | What changed | On release |

## What does not exist, and will not

**No phone number. No live chat. No SLA. No guaranteed response time. No dedicated
CSM. No onboarding call. No custom audit, POC, or pilot.**

Every one of those is a synchronous obligation, and a synchronous obligation is
the thing that turns a product a person can run in 30 minutes a day into a job.
The pricing assumes their absence. A customer who needs them needs a vendor with
staff, and the honest thing is to say so early rather than fail them later.

This is stated on the pricing page, in the Terms of Service, and here. Nobody
should discover it after paying.

## The rules

1. **If a question is asked twice, it becomes a docs page.** The reply then
   becomes a link. That is the only way one person scales support.
2. **False positives are the highest priority thing in the queue.** They are
   existential in a way a missing feature is not: one false positive teaches a team
   to ignore everything the tool says. Fix, add a regression fixture, ship, and say
   so publicly.
3. **Answer publicly wherever possible.** A GitHub issue answers everyone with the
   same question forever; an email answers one person once.
4. **Never let a canned response answer a legal question.** "Does this make us
   compliant" gets a real reply from a real person, every time, in writing.
5. **Same-day is not the standard. Same-week is.** Setting the expectation low and
   beating it is better than the reverse.

---

# Canned responses

Written before there are users, which is the only time you can write them without
being annoyed.

---

## 1. "Does this make us compliant with the EAA / WCAG / the ADA?"

> No, and I want to be clear about that rather than let it be ambiguous.
>
> Attest runs automated checks. Automated testing can evaluate roughly a quarter
> to a third of WCAG 2.1 success criteria — that is the ceiling for the category,
> not a limitation of this tool specifically. It cannot judge whether alt text is
> correct, whether reading order makes sense, whether focus goes anywhere sensible,
> or whether an error message is comprehensible.
>
> Conformance is a determination about a whole service, normally involving a human
> audit and testing with disabled users. It is not something a CI job can
> establish.
>
> What Attest does is handle the mechanical part, prove it does not regress, and
> produce a dated, verifiable record of what was checked and what was decided. That
> record is genuinely useful if anyone ever asks what you knew and when. It is not
> a compliance determination and I would not want anyone representing it as one.
>
> The full limits are here: https://attest.ci/docs/what-attest-cannot-detect
>
> If you need a conformance assessment, buy a manual audit. Deque, TetraLogical and
> The Paciello Group all do them properly, as do a lot of smaller independent
> practitioners.
>
> This is not legal advice.

---

## 2. "Attest reported something that is not a problem" (false positive)

> Thank you — this is the most useful kind of report I get, and it goes to the top
> of the queue.
>
> Could you send me:
>
> 1. The rule id
> 2. The code it fired on (or a reduced version)
> 3. Why it is correct as written
>
> If it is a false positive I will fix the rule, add a fixture so it cannot come
> back, and note it in the changelog. Two have been fixed this way already — both
> found by running against real repositories, and both written up publicly with
> before/after numbers.
>
> In the meantime you can suppress it:
>
> ```ts
> // attest-disable-next-line <rule-id> -- <reason>
> ```
>
> or turn the rule off in `attest.config.json`. Suppressions are recorded in the
> report with the reason, which is deliberate — but they will not block you.

---

## 3. "Do you support Vue / Svelte / Angular / Rails / WordPress?"

> Not properly, and I would rather tell you than take your money.
>
> The runtime accessibility checks are axe-core against a rendered page, so they
> work on anything — but you can get that from axe DevTools or `@axe-core/cli` for
> free, and Deque will do it better.
>
> The part that makes Attest worth choosing is the static analysis of the
> React/Next.js client-server boundary: session data entering shared caches, server
> values reaching the browser through import chains. That is React and Next.js only,
> and I am not planning to add frameworks — one framework family done properly is
> the whole strategy.
>
> If you are not on React, axe DevTools is probably what you want.

---

## 4. "Can we get SOC 2 / complete this security questionnaire / sign our MSA?"

> No, and honestly it is better that I say so now.
>
> Attest is run by one person. I do not have SOC 2 and am not pursuing it, I do
> not complete bespoke security questionnaires, and I do not sign custom contracts
> or negotiate the DPA.
>
> What I do have, all public:
>
> - Terms of Service: [URL]
> - Privacy Policy: [URL]
> - DPA, published and self-serve: [URL]
> - Subprocessor list: [URL]
> - Security documentation: [URL]
>
> The DPA covers what a standard questionnaire asks and is accepted by use, no
> signature needed.
>
> If your procurement process requires more, we are not a good fit, and I would
> rather you find that out before you pay than after. No hard feelings — the free
> tier is MIT licensed and is the whole tool, so you can use that with no
> relationship with me at all.

---

## 5. "Can you add an overlay / a widget / auto-fix?"

> No, and this one is a principle rather than a roadmap position.
>
> Overlays do not produce conformance. Their presence is frequently read by
> regulators and plaintiffs as evidence that a site was never actually made
> accessible, and in January 2025 the US Federal Trade Commission ordered accessiBe
> to pay $1,000,000 over claims that its AI overlay could make sites conform to
> WCAG.
>
> Attest will never inject anything into your site. It reports; you fix. The fix
> lands in your source, where it is real, reviewable, and still there if you stop
> paying me.
>
> There is a roadmap item for LLM-*proposed* patches delivered as pull requests you
> review and merge — with the failing check that motivated it and the passing check
> after. That is a different thing from a runtime overlay in every way that
> matters, and it will never auto-merge.

---

## 6. "It found nothing. Is it working?"

> Probably, but check one thing first: which layers actually ran.
>
> The bottom of the terminal output has a "Coverage" section. If it says
>
> ```
> Runtime accessibility (axe-core in a browser): skipped — no URLs were given
> ```
>
> then the accessibility rules that need a rendered page did not run, and a clean
> result says nothing about them. Pass `--url http://localhost:3000` with your app
> running.
>
> That distinction is deliberate throughout: a layer that could not run is always
> reported as *did not run*, never as clean.
>
> If everything ran and found nothing, that is a real result — for the checks that
> ran. It is not a statement that your app is accessible. See
> https://attest.ci/docs/what-attest-cannot-detect

---

## 7. "How do I cancel?"

> Settings → Billing → Cancel. It takes one click and no conversation with me.
>
> You keep access until the end of the period you have paid for, then the account
> drops to free. Nothing is deleted — your history is still there if you come back.
>
> Full refund within 30 days if it was not what you expected; just ask, no
> explanation needed.
>
> If something specific was wrong I would genuinely like to know, but that is not a
> condition of anything.

---

## 8. "Can I self-host it?"

> The CLI, the whole rule set and the GitHub Action are MIT licensed and run
> entirely on your own machines already. No account, no telemetry, nothing sent
> anywhere. That is most of the product and it is genuinely free forever.
>
> The hosted service — history, trends, signed exports, org policy — is not open
> source and there is no self-host option. It is the part that pays for the rest,
> and a self-hosted version would be a second product to support.
>
> If you cannot send report data off your network, the free tier plus committing
> the JSON reports into a repository gets you a workable audit trail. It is
> genuinely how I would do it in a regulated environment, and the content hashes
> still verify.

---

## When to break the rules

Rarely, and knowingly:

- A **security report** gets an immediate response, whatever time it is.
- A **false positive on a paying account** gets same-day acknowledgement.
- A **regulator or lawyer** contacting you about a customer's use of the product
  gets a careful, unhurried, written reply — and a lawyer of your own before you
  answer anything substantive.
