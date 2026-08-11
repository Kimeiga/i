# Data Processing Agreement — TEMPLATE

> **This is a template. It has not been reviewed by a lawyer. It is not legal
> advice. Do not publish it without a solicitor's review.**

**Published, self-serve, and non-negotiable.**

This document is accepted by using the Service and needs no signature. It is
published at a stable URL and versioned.

**We do not negotiate it.** Negotiating a DPA means engaging a lawyer per
customer, and a business at this price point cannot do that and remain a business.
If your organisation requires bespoke data processing terms, we are not able to
serve you — and we would rather tell you that now than after you have paid.

**Version:** [1.0] · **Effective:** [DATE] · Previous versions: [ARCHIVE URL]

---

## 1. Parties and roles

**You** (the "Controller") — the customer using the Service.
**Us** (the "Processor") — [LEGAL ENTITY], [COMPANY NUMBER], [ADDRESS].

This applies where we process personal data on your behalf. Where we process your
account and billing data for our own purposes, we are a controller and the
[Privacy Policy]([URL]) governs.

## 2. Subject matter, duration, nature and purpose

**Subject matter:** processing scan reports produced from your codebase and the
URLs you configure.

**Duration:** the term of your subscription, plus the retention period in §7.

**Nature and purpose:** storing, indexing, comparing and exporting scan reports so
you have a historical record of automated check results.

## 3. Categories of data subject and personal data

**Data subjects:** your developers (as report authors and suppression authors) and
any individual whose personal data appears incidentally in a code excerpt or a
scanned URL.

**Personal data:**

- GitHub usernames and email addresses of your developers
- Commit author information present in scan metadata
- Free-text suppression reasons written by your developers
- **Incidental personal data in code excerpts** — a finding's `evidence` field
  contains up to 400 characters of the source that triggered it, which may contain
  whatever is on that line
- URLs and CSS selectors from pages you scanned

**Special category data:** none is intentionally processed. If your source code
contains special category data, do not use the hosted service on it.

## 4. Our obligations

We will:

1. Process personal data only on your documented instructions, which comprise this
   DPA, the Terms of Service, and your configuration of the Service.
2. Ensure personnel with access are bound by confidentiality. **Currently one
   person has access: [NAME], the operator.**
3. Implement the technical and organisational measures in Annex A.
4. Not engage a subprocessor except as set out in §5.
5. Assist you, so far as we can given the nature of the processing, with data
   subject requests, breach notification, and data protection impact assessments.
6. Notify you without undue delay, and within 72 hours of becoming aware, of a
   personal data breach affecting your data.
7. On termination, delete or return the personal data as set out in §7.
8. Make available the information needed to demonstrate compliance with Article 28.

## 5. Subprocessors

You give **general written authorisation** for the subprocessors listed at
[SUBPROCESSORS URL].

We will give at least **30 days' notice** before adding or replacing one, by email
and by updating that page. You may object on reasonable data protection grounds;
if we cannot resolve the objection, you may terminate and receive a pro-rata
refund of the unused period.

Each subprocessor is bound by terms no less protective than these.

## 6. International transfers

Where personal data is transferred outside the UK/EEA, the transfer relies on the
Standard Contractual Clauses (Commission Implementing Decision (EU) 2021/914) or
the UK International Data Transfer Addendum, as applicable. By accepting this DPA
the parties are deemed to have entered into those clauses, with:

- Module Two (controller to processor) applying
- Docking clause: applicable
- Clause 9: Option 2, general written authorisation, 30 days' notice
- Clause 17: the law of [JURISDICTION]
- Clause 18: the courts of [JURISDICTION]
- Annex I and II: as set out in §3 and Annex A of this DPA

## 7. Retention and deletion

Scan reports are retained for **[7 YEARS]** by default, configurable downward per
account, because a record deleted before it was needed is not a record.

**Storage is append-only and hash-chained.** Individual records cannot be modified
or deleted, by us or by you. That is what makes the trail evidentially useful. On
request we delete an entire account and every record attached to it, within 30
days, save where law requires retention.

**We cannot excise a single finding from a stored report.** The hash chain would
break, and a broken chain is indistinguishable from tampering. If your reports may
contain personal data you will need removed, the remedy is to prevent it entering
them — configure `exclude` patterns for the paths concerned.

## 8. Audit

We will provide the information reasonably needed to demonstrate compliance with
Article 28 on request, no more than once a year.

**We do not host on-site audits and do not complete bespoke security
questionnaires.** For a business of this size that is a statement of scale. Our
[security documentation]([URL]) is public and covers what such a questionnaire
would ask.

## 9. Liability

Liability under this DPA is subject to the limitations in the Terms of Service.

## 10. Precedence

In conflict, this DPA prevails over the Terms of Service for matters of personal
data processing.

---

## Annex A — Technical and organisational measures

**Access control.** GitHub OAuth only; no passwords held. Production access
limited to the operator. Multi-factor authentication required on every
administrative account.

**Encryption.** TLS 1.2+ in transit. Encryption at rest on the database and
backups.

**Integrity.** Scan records are append-only, enforced by a database trigger rather
than by convention. Each record stores a SHA-256 content hash and a link to the
previous record's hash, so an alteration anywhere in the chain is detectable.

**Segregation.** Data is partitioned by account; every query is scoped by account
id at the data-access layer.

**Backups.** Automated daily, retained [30 DAYS], encrypted, restore tested
[QUARTERLY].

**Minimisation.** The CLI transmits nothing. The hosted service receives reports,
never repositories. Code excerpts are capped at 400 characters. Environment
variable values are never read — only names.

**Availability.** Best efforts. No service level agreement is offered and none
should be relied on.

**Incident response.** A documented procedure with a 72-hour notification
commitment. Contact: [SECURITY EMAIL].

---

_Template only. Not reviewed by a lawyer. Not legal advice._
