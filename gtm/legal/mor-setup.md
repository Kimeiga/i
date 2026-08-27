# Merchant of Record setup checklist

**Decision: use a Merchant of Record. Do not use bare Stripe. Do not build tax
logic.**

## Why

A Merchant of Record becomes the **legal seller** of your product. They take the
payment, they are the counterparty to the customer's transaction, and they are
liable for collecting and remitting VAT, GST and sales tax in every jurisdiction
the sale touches.

For a solo founder selling software internationally, that removes:

- EU VAT MOSS/OSS registration and quarterly filing
- UK VAT thresholds and returns
- US state-by-state economic nexus tracking (each state has its own threshold, and
  they change)
- Canadian GST/HST, Australian GST, Japanese consumption tax, and the growing list
  of countries taxing digital services
- Reverse-charge handling for B2B EU sales
- Invoice format requirements that differ by country
- Dunning, chargebacks, and fraud screening

The cost is roughly 5% + fixed fee, versus Stripe's ~2.9% + 30c. **The 2% is the
cheapest employee you will ever hire.** With bare Stripe you are the seller of
record and every one of the above is your personal legal obligation, in every
jurisdiction you sell into, from the first sale.

## Paddle vs Lemon Squeezy

Both are genuine Merchants of Record. Note that Lemon Squeezy was acquired by
Stripe in 2024 — check its current status and roadmap before committing, since
that acquisition may change the product.

| | Paddle | Lemon Squeezy |
| --- | --- | --- |
| MoR | Yes | Yes |
| Fees | ~5% + 50c (check current) | ~5% + 50c (check current) |
| Approval | Manual review, can take days | Faster |
| Suited to | B2B SaaS subscriptions | Smaller digital products |
| Subscription features | Deeper | Simpler |
| API and webhooks | Mature | Good |

**Recommendation: Paddle**, on the basis that this is B2B SaaS subscriptions with
a Team tier, seat and repository counts, and eventual invoicing needs. Verify
current pricing and terms yourself — both change.

## Checklist

### Before writing any billing code

- [ ] Choose the provider, having checked current fees and terms
- [ ] Apply for an account (identity verification, business details, bank account)
- [ ] **Wait for approval before building.** Paddle rejects applications; find out
      first.
- [ ] Read their acceptable use policy. Confirm a developer tool adjacent to
      accessibility compliance is fine — it is, but confirm.
- [ ] Configure tax settings; the provider handles the rest
- [ ] Set up the sandbox

### Product configuration

- [ ] Solo — $49/repo/month, monthly
- [ ] Team — $299/month, up to 10 repositories, monthly
- [ ] No annual plans initially. They complicate refunds and pro-rating for a
      product with no proven retention.
- [ ] Decide the trial: 14 days, no card, or no trial at all. **Prefer no trial** —
      the free tier is the trial, and it is unlimited.
- [ ] Set the customer portal URL so cancellation is self-serve. Never make
      cancelling require an email.

### Integration

- [ ] Checkout link or overlay from the pricing page
- [ ] Webhook endpoint for `subscription.created`, `.updated`, `.cancelled`,
      `payment.failed`
- [ ] **Verify webhook signatures.** Not optional.
- [ ] Map the provider's customer id to your account id at first checkout
- [ ] Handle failed payments: grace period, then downgrade to free — never delete
      data
- [ ] Test the full lifecycle in sandbox: subscribe, upgrade, downgrade, cancel,
      fail, recover

### Legal and operational

- [ ] Reference the MoR in the Terms of Service as the seller of record
- [ ] List them as a subprocessor
- [ ] Confirm they issue compliant invoices — customers will ask for VAT invoices
      and you want the answer to be "from your receipt email"
- [ ] Set your refund policy and publish it. Suggested: **full refund within 30
      days, no questions.** At this price the goodwill is worth more than the
      revenue, and arguing about it is time you do not have.
- [ ] Set the payout schedule and bank account

### Do not

- [ ] Do not build your own tax calculation
- [ ] Do not store card details anywhere, ever
- [ ] Do not implement your own dunning
- [ ] Do not use bare Stripe "for now" — migrating a live subscription base later
      is genuinely painful and the tax exposure accrues from sale one

## GitHub Marketplace

A paid Marketplace listing requires the app to be owned by an organisation with
two-factor authentication enabled and a verified domain, and requires completing
publisher verification.

**`[UNVERIFIED]`** We have seen it claimed that a minimum number of installations
is required before a paid plan is permitted. GitHub's published requirements cover
organisation ownership, 2FA and domain verification; we found no install-count
threshold in the documentation and could not reach the docs directly to confirm.
**Check this yourself before planning around it.**

Either way, listing free first and adding paid plans later is the right sequence:
adoption should precede billing.

Note that GitHub Marketplace billing is **not** a Merchant of Record arrangement in
the same sense — check who is liable for tax on Marketplace sales before enabling
paid plans there, and expect to run MoR checkout as the primary path regardless.

## Budget

Setup: **$0**. Both providers charge per transaction, not up front. Verification
may require a business bank account.

This does not consume the $2,000 cap until you make a sale.
