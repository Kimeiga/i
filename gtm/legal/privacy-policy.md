# Privacy Policy — TEMPLATE

> **This is a template. It has not been reviewed by a lawyer. It is not legal
> advice. Do not publish it without a solicitor's review.**
>
> **Before publishing, check every claim against what the code actually does.** A
> privacy policy that overstates your restraint is worse than one that
> understates it. `apps/api/src/` is the authority; this document must follow it.

**Last updated:** [DATE]
**Controller:** [LEGAL ENTITY], [ADDRESS]. Contact: [PRIVACY EMAIL].

---

## The short version

The CLI runs entirely on your machine and sends nothing anywhere. There is no
telemetry, no usage tracking, no phone-home. You can verify that: the source is
MIT licensed and there is no network code in it outside of the browser automation
that loads URLs you supply.

If you use the hosted service, we receive the scan **report** — findings, file
paths, line numbers, and short code excerpts. We do not receive your repository.

---

## What we collect

### From the CLI and GitHub Action: nothing

No telemetry. No analytics. No version check. Running `attest scan` makes no
outbound request except to URLs you explicitly pass with `--url`.

### If you connect the hosted service

**Account data**, from GitHub OAuth: your GitHub user id, username, avatar URL,
email address, and the list of repositories you grant access to. We request the
narrowest scopes that work.

**Scan reports**, uploaded by your CI:

- Rule identifiers, severities, and messages
- **File paths and line numbers** from your repository
- **Short code excerpts** — the `evidence` field, capped at 400 characters, being
  the specific expression that triggered a finding
- URLs you scanned, and CSS selectors within those pages
- Commit SHAs, branch names, repository names
- Suppression reasons your developers wrote
- Aggregate metrics: startup JavaScript sizes, counts, timings

**Be aware of what that means.** A code excerpt can contain whatever is on that
line. A finding on `process.env.STRIPE_SECRET_KEY` records the variable *name*,
not its value — we never read environment values — but if you hardcode a secret in
source, and a rule fires on that line, the excerpt will contain it. Do not hardcode
secrets in source; if you have, rotate them, and note that the excerpt would also
be in your git history, which is the larger problem.

**Billing data:** held by our merchant of record, [PADDLE / LEMON SQUEEZY], not by
us. We receive a subscription status and the last four digits of a card. We never
see full card details.

**Server logs:** IP address, user agent, timestamp, endpoint. Retained [30 DAYS].

## What we do not collect

- Your source code. We receive reports, not repositories.
- Environment variable *values*.
- Anything from the CLI when used without the hosted service.
- Cookies for tracking. Session cookies only, on the dashboard.
- Anything from third-party analytics or advertising. There are none on any of our
  properties.

## Why we process it

| Purpose | Lawful basis (UK/EU GDPR) |
| --- | --- |
| Providing the service | Performance of a contract |
| Keeping the evidence trail | Performance of a contract; legitimate interests |
| Billing | Performance of a contract; legal obligation |
| Security and abuse prevention | Legitimate interests |
| Service email (outages, breaking changes) | Legitimate interests |

No marketing email without opt-in. No profiling. No automated decision-making with
legal effects.

## How long we keep it

**Scan reports: [7 YEARS] by default.** Longer than most limitation periods,
because a record you deleted before you needed it is not a record. Configurable
downward per account.

Account data: for the life of the account, then [90 DAYS].
Logs: [30 DAYS]. Billing records: as tax law requires, typically [7 YEARS].

## Append-only storage, and what that means for deletion

Scan records cannot be modified or deleted individually. That is the point of the
evidence trail: a record you can quietly edit is not evidence.

On an account deletion request we delete the whole account and every record
attached to it. What we cannot do is remove one finding from one report while
leaving the rest — the hash chain would break, and a broken chain is
indistinguishable from tampering.

If your reports may contain personal data, the answer is to stop them containing
it, not to edit them afterwards.

## Who we share it with

Only the subprocessors listed at [SUBPROCESSORS URL], and only as needed.

We do not sell personal data. We do not share it for advertising. We disclose it to
authorities only where legally required, and we will tell you unless prohibited.

## International transfers

Data is stored in [REGION]. Where a subprocessor processes data outside the
UK/EEA, transfers rely on [STANDARD CONTRACTUAL CLAUSES / UK IDTA / ADEQUACY]. See
the subprocessor list for each.

## Your rights

Under UK/EU GDPR: access, rectification, erasure, restriction, portability,
objection, and withdrawal of consent. Email [PRIVACY EMAIL]; we respond within 30
days.

You may complain to your supervisory authority — in the UK, the
[ICO](https://ico.org.uk/).

Export is self-serve from the dashboard: everything we hold, as JSON.

## If you are a data processor for your own customers

You may be a controller and we your processor. Our [DPA]([URL]) is published,
self-serve and **non-negotiable**. It incorporates the Standard Contractual Clauses
where relevant.

We do not sign bespoke data processing terms. That is not obstinacy: negotiating
one means paying a lawyer per customer, which a business of this size cannot do
while keeping the price where it is. If your organisation requires bespoke terms,
we are not able to serve you, and we would rather say so before you pay.

## Security

Encryption in transit (TLS 1.2+) and at rest. GitHub OAuth only — we never hold a
password. Access to production data is limited to the operator, [NAME], who is
currently the only person with any access at all.

<!-- claims-ok: denying a certification, not claiming one -->
**We are not SOC 2 certified and we are not pursuing certification.** For a
business this size that is an honest statement of scale, not a security posture; if
your procurement requires it, we are not a good fit.

We will notify affected customers of a personal data breach without undue delay
and within 72 hours of becoming aware, as required.

## Children

Not directed at children. We do not knowingly collect data from anyone under 16.

## Changes

Material changes notified by email at least 30 days in advance. The change history
is public at [CHANGELOG URL].

---

_Template only. Not reviewed by a lawyer. Not legal advice. Verify every statement
against the code before publishing._
