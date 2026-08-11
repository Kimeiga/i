# Attest vs accessibility overlays

<!-- claims-ok: this page quotes the FTC complaint's characterisation of accessiBe's marketing verbatim -->

**Short version: do not buy an overlay. Not ours — we do not sell one — and not
theirs.**

An accessibility overlay is a JavaScript snippet you add to your site that claims
to detect and fix accessibility problems in the browser at page load. accessiBe,
UserWay, AudioEye and EqualWeb are the best-known.

Attest is not an overlay and never will be. There is no script tag. Nothing is
injected into your site. Nothing is modified at runtime. Attest runs in your CI
and produces a report.

## Why not an overlay

**A regulator has already ruled on the claims.** In January 2025 the US Federal
Trade Commission ordered accessiBe to pay **$1,000,000** to settle allegations
that it misrepresented what its AI-powered accessWidget could do. The FTC's
complaint said the company advertised that the product would "[a]utomatically
comply" with WCAG 2.1 AA, and that the claims "were not supported by competent and
reliable evidence". The complaint also alleged that accessiBe formatted
third-party articles and reviews to look independent while failing to disclose
material connections to the reviewers. The order was finalised in April 2025 and
bars the company from representing that its automated products can make any
website conform to WCAG, absent evidence.

Primary source: [FTC press release, 3 January
2025](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-order-requires-online-marketer-pay-1-million-deceptive-claims-its-ai-product-could-make-websites)
and the [case page](https://www.ftc.gov/legal-library/browse/cases-proceedings/2223156-accessibe-inc).

**They do not stop lawsuits, and may attract them.** Businesses using overlays
have continued to be sued in the US, and the presence of an overlay is frequently
read as evidence that the underlying site was never made accessible. Adding a
widget is a decision you have to explain later.

**The accessibility community is unanimous against them.** Hundreds of
practitioners, including many disabled users of assistive technology, have signed
the [Overlay Fact Sheet](https://overlayfactsheet.com/). If you plan to hire an
accessibility consultant, ask them first — you will get a consistent answer.

**They cannot do the thing they claim.** An overlay guesses at alt text, guesses
at ARIA roles, and guesses at structure, at runtime, from markup that does not
carry the information. Whether an image is decorative, what a button does, what
the reading order means — none of it is recoverable from the DOM. Guessing
produces a page that announces confident nonsense, which is worse for a screen
reader user than a page that announces nothing.

**They frequently break assistive technology.** The most common complaint from
actual screen reader users is that the overlay's own interface interferes with the
tools they already have configured.

## The comparison, such as it is

| | Overlay | Attest |
| --- | --- | --- |
| Modifies your site at runtime | Yes | No |
| Requires a script tag | Yes | No |
| Claims to fix accessibility | Yes | No |
| Claims to deliver conformance | Yes, and one vendor was fined for it | No |
| Fixes anything | No | No — it reports, you fix |
| Endorsed by accessibility practitioners | No | Ask them; we would rather they say than we did |
| Effect on your source | None | You change the code |

The honest row is the fifth one. **Attest fixes nothing either.** It tells you
what is wrong and you fix it. The difference is that the fix lands in your source,
where it is real, reviewable, and still there when the subscription lapses.

## What overlay vendors get right

One thing, and it is worth acknowledging: they made accessibility legible to
people who buy software. A business owner who has never heard of WCAG understands
"add this line and be covered". That is why the category exists.

The answer to that demand is not a better widget. It is being honest that there
isn't one.

## If you already have an overlay

You do not have to panic, but do this:

1. **Test your site with the overlay disabled.** That is the real baseline.
2. **Test with the overlay enabled, using a screen reader.** Check whether it
   helps or interferes.
3. **Fix the underlying markup.** That work is not wasted whatever you decide.
4. **Read your contract before removing it.** Some include auto-renewal terms and
   indemnities that are worth understanding.
5. **If you are relying on an overlay vendor's legal indemnity, ask a lawyer what
   it actually covers.** Not us — we are not one.

## When you should not use Attest

- **You are not on React or Next.js.** Most of what makes us worth choosing does
  not apply.
- **You want something you install and stop thinking about.** That is what the
  overlay pitch is, that is what does not exist, and we are not a version of it.
- **You have nobody who can change the code.** We produce findings for engineers.
  With no engineer, buy a manual audit and a remediation contract instead.

---

_This page describes products we do not control and characterises a regulatory
action from its primary source, linked above. It is not legal advice. If anything
here is out of date or unfair, [open an
issue](https://github.com/attest-ci/attest/issues) and we will fix it._
