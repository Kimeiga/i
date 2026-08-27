# Subprocessors — TEMPLATE

> **Template.** Fill in what you actually use before publishing. The DPA
> references this page, so it must be accurate and current, and changes require 30
> days' notice to customers.

**Last updated:** [DATE]

Published at [STABLE URL]. Subscribe to changes: [RSS / EMAIL LIST].

## Current subprocessors

| Subprocessor | Purpose | Data processed | Location | Transfer mechanism |
| --- | --- | --- | --- | --- |
| [HOSTING PROVIDER] | Application hosting | All service data | [REGION] | [SCC / UK IDTA / adequacy] |
| [DATABASE PROVIDER] | Postgres, evidence store | Scan reports, account data | [REGION] | [—] |
| [PADDLE / LEMON SQUEEZY] | Merchant of record, billing | Name, email, billing address, tax status | [REGION] | [—] |
| GitHub, Inc. | OAuth, Action distribution | GitHub id, username, email | US | [SCC] |
| [EMAIL PROVIDER] | Transactional email | Email address | [REGION] | [—] |
| [ERROR TRACKING] | Error monitoring | IP, user agent, stack traces | [REGION] | [—] |

## Deliberately absent

Naming these is as informative as naming the ones above.

- **No analytics provider.** No Google Analytics, no product analytics, no session
  recording, on any property.
- **No advertising or marketing platform.**
- **No customer data platform or CRM** holding customer data.
- **No LLM provider processing customer code by default.** If model-assisted
  explanations ship, they will be opt-in per account, the provider will be listed
  here first with 30 days' notice, and the tool will remain fully functional with
  them disabled.

## Changes

We give at least **30 days' notice** before adding or replacing a subprocessor, by
email to account owners and by updating this page.

You may object on reasonable data protection grounds. If we cannot resolve it, you
may terminate and receive a pro-rata refund.

## Notes on choosing these

**Merchant of record, not a payment processor.** [PADDLE / LEMON SQUEEZY] is the
legal seller of record and handles VAT, GST and sales tax remittance across every
jurisdiction. That is a deliberate architectural decision: it removes 40+ tax
registrations from a one-person business. It also means they hold the billing
relationship and the customer's payment data, and we hold neither.

**Error tracking is a real trade-off.** Stack traces can contain file paths and
occasionally fragments of data. Configure scrubbing before enabling it, and if
scrubbing cannot be made reliable, do without.

---

_Template only. Not reviewed by a lawyer. Not legal advice._
