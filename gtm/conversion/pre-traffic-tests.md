# Pre-traffic tests

Run before spending a single visitor on an experiment. These eliminate pages that
fail comprehension, which no amount of traffic will fix and which an A/B test
will only measure expensively.

None of these has been run. They are the next thing to do and they cost hours,
not money.

---

## 1. Five-second test

Show the first viewport only, for five seconds, then take it away.

**Ask:**

1. What does this product do?
2. Who is it for?
3. What problem does it solve, or what failure does it prevent?
4. What would you click?
5. What do you remember?

**Do not ask** whether they like it. Preference is not comprehension and the two
are frequently inversely related in technical products.

**Pass condition for the current home page (H2, mechanism):** at least 7 of 10
participants say something recognisably close to *"it checks React/Next.js code
in CI"*, and at least 5 mention either accessibility **or** the client/server
boundary.

**The specific risk being tested.** "The file with the bug in it looks fine" is a
hook, not a description. The eyebrow carries the category. If participants
consistently cannot say what the product is, the headline is too clever and the
mechanism-first framing has failed — that is a real possible outcome and the
reason this test comes before any traffic.

**Falsification is the point.** If /for/github outperforms / on question 1, the
default page should probably be H3 and the mechanism page should become the
challenger.

---

## 2. First-click test

Give a task, show the full page, record the first click.

| Task | Correct first click |
| --- | --- |
| "You want to try this without creating an account." | Copy-the-command button |
| "You want to know whether it works with Vue." | FAQ, or the limits table |
| "You want to know whether it claims to make you compliant." | The limits box in the hero, or the not-an-overlay section |
| "You want to see it find something real." | The evidence section, or the report link |
| "You want to know what it costs." | The price table |

Measure correct first click, time to click, and what the misclicks were.

**The one that matters most is the third.** If a visitor cannot quickly find out
whether this is a compliance product, the disclaimers are being read as
boilerplate — which would mean the honesty is decorative rather than structural,
and the page needs a different shape rather than more words.

---

## 3. ICP message test

Ten to twenty practitioners: staff frontend engineers or engineering managers, at
20–500 person companies, on React or Next.js, without a dedicated accessibility
team.

Ask separately about **relevance, clarity, credibility, differentiation,
perceived effort, perceived risk, action intent, and primary scepticism.** Rate
each, then ask for the reason in their own words.

**The average of the ratings is the least useful output.** The useful output is a
sentence like:

> "I get that it finds the import-graph thing, but that has never actually bitten
> us, and I would not add a CI check for it."

That sentence changes the page. A 3.8 out of 5 does not.

### The assumption most worth testing

The "What we got wrong" section — publishing our own false positives on the
landing page — is the single largest bet in the rewrite. Two outcomes are
plausible and they point in opposite directions:

- It reads as unusual honesty in a category full of overclaiming, and it is the
  most persuasive thing on the page.
- It reads as *this tool is buggy*, and it costs installs.

Test it directly: show the page with and without that section, to different
practitioners, and ask about credibility and intent. Do not guess.

### Where to recruit

The accessibility community post is the honest route and it doubles as the first
[voice-of-customer](voice-of-customer.md) entries. Ask for criticism, not
signups. Anyone who tells you a rule is wrong is worth more than anyone who says
the page looks good.

---

## 4. Comprehension of the limits

Specific to this product, and not a standard test.

Show the page, then ask: **"If you installed this and ran it on every pull
request, what would you still need to do for accessibility?"**

**Pass condition:** most participants can name at least one of — manual keyboard
testing, screen reader testing, whether alt text is *correct*, a human audit.

If they cannot, the page has failed at the thing it is most trying to do,
regardless of how it scores on anything else. That failure would not show up in a
conversion test — it would show up later, as a support conversation with somebody
who believed they had bought compliance.

---

## What none of these establish

Whether the page converts. They establish that it is understood, that its limits
land, and that its central bet is not backfiring. Those are prerequisites for a
useful experiment, not substitutes for one.
