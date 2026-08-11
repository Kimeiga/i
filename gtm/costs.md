# What costs money, and how

The spend cap is **$2,000** before paid retention exists. This is the ledger
against it, with every figure marked as verified, quoted, or estimated.

**Verified 2026-08-11** where marked. Prices change; re-check before spending.

---

## The short answer

Launching costs **~$310–830 one-off**, and the recurring cost can be **$0/month**
if the site is hosted somewhere whose free tier permits commercial use.

The single largest line is a solicitor, and it is the one worth paying.

---

## One-off, unavoidable

| Item | Cost | How it is incurred |
| --- | --- | --- |
| Domain, first year | **$9.99–11.25** *(verified)* | Registrar, annual renewal |
| Solicitor review of ToS, Privacy, DPA | **$300–800** *(estimated)* | Two hours of review, not drafting |

### Domain — cheaper than previously written, and a correction

Checked against a registrar on 2026-08-11:

| | |
| --- | --- |
| `attestci.dev` | **$9.99/yr — available** |
| `attestci.com` | **$11.25/yr — available** |
| `attest-ci.com` | **$11.25/yr — available** |
| `attestly.com` | taken |
| `attest.dev` | taken |

**`attest.ci` — the domain currently hardcoded in `PRODUCT_URL` — was not
offered at all.** `.ci` is Côte d'Ivoire's ccTLD, is not carried by every
registrar, and ccTLDs of that kind commonly run $60–200/yr rather than $10.

So the domain in the product is both the most expensive option and possibly not
purchasable through the obvious channel. `attestci.dev` at $9.99 is the sensible
default: `.dev` is on the HSTS preload list, so it is HTTPS-only by construction,
which suits a security-adjacent developer tool.

It is one constant to change: `PRODUCT_URL` in `packages/core/src/product.ts`.

### Solicitor — the line worth paying

$300–800 is an estimate and varies by jurisdiction. It buys two hours of review
of four documents that already exist, not a drafting engagement.

Tell them the product reports automated checks and explicitly does **not**
determine conformance. A lawyer optimising for caution may blur that in the wrong
direction, and the distinction is the entire positioning.

---

## Recurring — and the trap in it

### Hosting the site: **$0 or $240/year**, depending on where

**Vercel's Hobby plan prohibits commercial use.** A business site on Vercel needs
Pro at **$20/month per seat = $240/year**. An earlier draft of `LAUNCH.md` said
hosting was ~$0; that was wrong for a commercial project on Vercel and is
corrected here.

The escape is that **this site is essentially static**: 54 of its 55 routes are
prerendered at build time. The only dynamic route is `/api/e`, the first-party
event sink, which is disabled unless `NEXT_PUBLIC_ATTEST_EVENTS=1` and is not
enabled in this repository.

So the realistic options:

| Option | Cost | Notes |
| --- | --- | --- |
| Cloudflare Pages / Workers | **$0** | Free tier permits commercial use |
| GitHub Pages | **$0** | Free, commercial use permitted, needs a static export |
| Netlify free tier | **$0** | Check current commercial terms |
| Vercel Pro | **$240/yr** | Best Next.js integration; `vercel.json` is already written |

**Recommendation: start free elsewhere, move to Vercel Pro only if the deployment
friction becomes real.** $240/year is 12% of the entire cap spent on convenience
before a single visitor exists.

### Everything else at launch: **$0**

| | Why free |
| --- | --- |
| npm publishing | Public packages are free, including provenance |
| GitHub repository | Public |
| **GitHub Actions** | Unlimited free minutes on standard runners **for public repositories**. Chromium installs and Playwright runs cost nothing here. **Make the repo private and this becomes billable.** |
| GitHub Marketplace free listing | Free |
| The CLI | Runs on the user's machine |
| axe-core, Playwright, ts-morph | Open source |
| Email forwarding for `support@` | Free with most registrars, or Cloudflare Email Routing. A real mailbox (Google Workspace) is ~$7/user/month and not needed yet. |

---

## Only when there is revenue

| | Cost | Trigger |
| --- | --- | --- |
| Paddle / Lemon Squeezy | ~5% + fixed fee per transaction | Per sale. **$0 to set up.** |
| Hosted API (Fly, Railway, Render) | ~$5–20/month | Only when someone can buy something |
| Postgres | $0 on a free tier, then ~$10–25/month | See the growth note below |

The ~5% Merchant of Record premium over bare Stripe's ~2.9% buys VAT, GST and
sales-tax registration and remittance across 40+ jurisdictions. For a founder
with no accountant that 2% is the cheapest employee the business will ever have.

---

## The sneaky one: evidence storage grows forever

The evidence store is **append-only with seven-year retention**, which is a
product decision, not an accident — a record deleted before it was needed is not
a record. But it means storage only ever goes up.

From the three reports actually in this repository: **13.7 KB to 65.8 KB each,
mean 33.8 KB.**

A Team-tier customer, 10 repositories, 20 pull requests a day, two scans each:

```
10 repos × 20 PRs × 2 scans × 33.8 KB   ≈  13.5 MB/day
                                        ≈   4.9 GB/year
                                        ≈    35 GB over the 7-year retention
```

At $299/month that is comfortably profitable, but three things follow:

1. **A free tier with a 500 MB database is exhausted by one active repository in
   about a month.** Plan for a paid Postgres from the first paying customer.
2. Storage is the one cost that scales with *usage* rather than with *customers*,
   so a heavy user on Solo at $49/month is the margin risk, not the Team account.
3. The `retention_days` column already exists and is configurable downward. It is
   the pressure valve, and lowering the default is a product decision with
   evidentiary consequences — not something to do quietly when a bill arrives.

---

## Runaway risks

Things that can cost more than expected, and the fuse for each.

| Risk | Fuse |
| --- | --- |
| Repository made private → Actions minutes billable | Keep it public; the packages are MIT anyway |
| A scan report page gets shared widely → bandwidth | Static hosting on a free tier absorbs this; Vercel Pro's included bandwidth does too |
| Postgres growth (above) | `retention_days`, and paid Postgres from customer one |
| LLM tokens, Phase 4 | Capped per account and logged per account from the first call; the feature is off by default and the tool works without it |
| Domain renewal on an expensive ccTLD | Avoid `.ci`; `.dev` at $9.99 |
| A second Vercel seat | Pro is per seat. One person, one seat. |

---

## Running total against the $2,000 cap

| | |
| --- | --- |
| Spent so far | **$0** |
| To reach Gate 5 (launch and distribution) | **~$310–830** |
| Remaining buffer for Gate 6 (hosted service) | **~$1,170–1,690** |

The buffer should not be touched until Gate 5 produces installs. Spending it
earlier converts an unproven distribution thesis into a monthly bill.
