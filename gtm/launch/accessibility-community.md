# For the accessibility community

**Read this before posting anywhere else.** This community has been lied to by
vendors for a decade — overlay companies especially — and they can smell marketing
from a long way off. They are also the only real channel this product has: if
practitioners think you are honest, they recommend you; if they think you are
another vendor, nothing else you do will matter.

Where: [a11y Slack](https://web-a11y.slack.com), the WebAIM mailing list,
`#accessibility` on various Discords, Mastodon (`@a11y` hashtags), r/accessibility.

Rules for every one of them:

1. **Lead with limitations.** First substantive paragraph, not the last.
2. **Credit axe-core and Deque explicitly**, by name, early.
3. **Make no compliance claim.** Not softened, not implied, not "helps you become".
4. **Ask for criticism, not signups.** No link to pricing. No call to action.
5. **Do not post the same text everywhere.** Write for the venue.
6. **If someone tells you a rule is wrong, they are probably right.** Fix it, say
   you fixed it, and thank them by name.
7. **Do not argue.** If the response is hostile, the correct reply is a question.

---

## Post: introduction, asking for criticism

> **I built an accessibility CI check and I would like it torn apart**
>
> I want to be upfront about what this is and is not, because I know what usually
> shows up here.
>
> It is a CI check for React and Next.js codebases. It runs axe-core — Deque's,
> unmodified — against rendered pages, plus some source-level rules, and reports
> what *changed* on a pull request rather than a list of everything.
>
> **It catches maybe a quarter to a third of WCAG 2.1 success criteria, which is
> the ceiling for automated testing generally, not a limitation I plan to fix.**
> It cannot tell you whether alt text is correct, whether reading order makes
> sense, whether focus goes anywhere sensible, or whether an error message helps.
> I have written all of that down here: <link to what-attest-cannot-detect>
>
> It is not an overlay. It will never be an overlay. It does not modify your site
> at runtime and there is no script tag.
>
> It does not make anyone compliant, and I do not say it does anywhere. There is a
> CI check in the repo that greps my own docs and landing page for the usual
<!-- claims-ok: naming the vocabulary the build check bans, not claiming it -->
> vendor vocabulary — "compliant", "certified", and so on — and fails the build,
> because I do not trust myself at 11pm.
>
> What I would genuinely like from this group:
>
> 1. **Are any of my rules wrong?** All 30 have public docs pages with code that
>    triggers them and code that does not: <link>. I have already had to fix two
>    false positives found by running it against real repos, one of which would
>    have made it useless on any codebase with a design system.
> 2. **Are my WCAG mappings defensible?** I deliberately labelled heading-order as
>    an axe best practice rather than a success criterion, because no SC requires
>    sequential heading levels. If I have got any of the others wrong I would
>    rather know now.
> 3. **Is there a rule you wish existed?** Especially in the "no tool checks this
>    and it drives me mad" category.
>
> It is MIT licensed and the free tier is the whole tool. I do plan to charge for
> hosted history later, which I mention so nobody feels ambushed by it.
>
> Happy to be told this is unnecessary.

---

## Post: the boring-but-useful one

Better second post, a few weeks later, once you have something specific.

> **axe does not report placeholder-only form fields, and I think that is right**
>
> While building an accessibility linter I found that axe-core does not flag
> `<input placeholder="Email">` with no label. I assumed a bug and went looking.
>
> It is not a bug. The placeholder does supply an accessible name under the
> accessible-name computation, so the markup is valid and axe is correct to pass
> it. It is a WCAG 3.3.2 problem — the label vanishes the moment the field has a
> value, exactly when someone reviewing their answers needs it — not a markup
> error.
>
> I have made my own rule report it, and documented the disagreement rather than
> hiding it: <link to the rule page>
>
> Curious whether people here think that is the right call, or whether reporting
> something axe deliberately passes is the beginning of the slippery slope that
> ends in a tool nobody trusts.

That post gives before it takes, is about something real, and demonstrates that you
read the specification instead of assuming.

---

## Things that will get you dismissed, permanently

- Any sentence containing "compliant" as something you deliver.
- Any percentage of coverage you cannot source.
- "AI-powered" anything.
- Describing your tool as a solution to a legal problem.
- Posting about the EAA with a link to your pricing page.
- Arguing with a disabled person about their own experience.
- Not disclosing that you sell something.
- DMing people who reply.

## Things worth doing

- Post the false positives you found in your own tool. Every time.
- Credit Deque, WebAIM, and the APG when you rely on them.
- Answer questions that have nothing to do with your product.
- When someone else's tool is the better answer, say so.
- Link to manual audit providers. Attest is not a substitute for one and saying so
  costs nothing and buys everything.
