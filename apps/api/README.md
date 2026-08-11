# Attest API — the hosted evidence store

**Proprietary.** See [`../LICENSE`](../LICENSE). The open source parts of the
product — the engine, every rule, the CLI, the Action — are under
[`../../packages`](../../packages) and are MIT.

This is the part people pay for: history, organisation policy, signed evidence
exports, and accessibility statement drafting.

## What makes it different from a database with an API on it

**Scan records cannot be modified or deleted.** A database trigger rejects
`UPDATE` and `DELETE` on `scans`. Not a convention, not a code review rule — a
constraint. Under a subpoena the difference between the two is the whole
question.

**Records are hash-chained.** Each scan stores the previous scan's chain hash for
that repository. Removing or reordering a record breaks every link after it, and
`GET /v1/repos/:owner/:repo/verify` says exactly which record broke and when it
was scanned.

**Reports are verified on the way in.** A report whose contents do not match its
own content hash is rejected with 422. Storing something unverifiable in a store
whose only purpose is being verifiable would defeat the point.

**Exports are signed, and verifiable without us.** Ed25519 over the canonical
manifest, public key published at `/.well-known/attest-signing-key.pem`, with
step-by-step verification instructions inside the export itself.

## Running it

```bash
createdb attest
export DATABASE_URL=postgres://localhost/attest
pnpm --filter @attestci/api build
pnpm --filter @attestci/api migrate
pnpm --filter @attestci/api keygen   # prints the signing key env vars
pnpm --filter @attestci/api start
```

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `GITHUB_CLIENT_ID` / `_SECRET` / `GITHUB_REDIRECT_URI` | yes | OAuth |
| `EVIDENCE_PRIVATE_KEY` / `_PUBLIC_KEY` / `_KEY_ID` | for exports | Ed25519, from `keygen` |
| `MOR_WEBHOOK_SECRET` | for billing | Webhooks are rejected without it |
| `MOR_PRODUCT_SOLO` / `MOR_PRODUCT_TEAM` | for billing | Product ids → plans |
| `DASHBOARD_URL`, `PUBLIC_URL`, `PRICING_URL` | no | Redirects and links |
| `PORT` | no | Defaults to 8080 |

## Endpoints

| Method | Path | Auth | |
| --- | --- | --- | --- |
| GET | `/health` | – | |
| GET | `/.well-known/attest-signing-key.pem` | – | Public verification key |
| GET | `/auth/github` → `/auth/github/callback` | – | OAuth |
| POST | `/auth/logout` | session | |
| GET | `/v1/me` | either | |
| POST | `/v1/tokens` | session | Returns the token once; only its hash is stored |
| POST | `/v1/repos/:owner/:repo/scans` | token | Ingest |
| GET | `/v1/repos/:owner/:repo/scans` | either | History |
| GET | `/v1/repos/:owner/:repo/verify` | either | Walk the hash chain |
| GET | `/v1/scans/:id` | either | One report |
| GET | `/v1/scans/:base/diff/:head` | either | Semantic diff |
| POST | `/v1/repos/:owner/:repo/export` | either | Signed export (Team) |
| POST | `/v1/repos/:owner/:repo/statement` | either | Draft statement (Team) |
| DELETE | `/v1/account` | session | Whole account only |
| POST | `/webhooks/billing` | signature | Merchant of Record |

## Two design decisions worth knowing

**There is no endpoint that deletes one scan.** Account deletion removes
everything; there is no path that excises a single record. The chain would break,
and a broken chain is indistinguishable from tampering. This is stated in the DPA
and the privacy policy, with the remedy being to keep personal data out of reports
in the first place — `exclude` patterns in `attest.config.json`.

**Failed payment downgrades, never deletes.** The evidence trail is what a
customer came for, and destroying it over an expired card is not a retention
strategy — it is a reason never to come back.

## The statement generator

`POST /v1/repos/:owner/:repo/statement` drafts an accessibility statement from
real scan data, in the shape of the model statement used under the EU Web
Accessibility Directive.

Three things are enforced in the output rather than left to the caller:

1. **It never states a conformance level.** That is a determination requiring
   human evaluation, and the section is left explicitly for a person to complete.
2. **It states its own method and that method's limits** before the findings.
3. **It is marked DRAFT** and returns a `todos` array of everything a human must
   resolve. A generated statement published unread is a public document asserting
   things nobody checked.

## Not built, deliberately

No SAML, no SCIM, no audit-log API, no SOC 2, no on-premise, no per-customer
configuration. Each one is the first step of an enterprise sales motion that this
business cannot staff. See `gtm/positioning.md`.

---

_Attest reports the results of automated checks. A clean run is not a conformance
claim, a legal opinion, or a substitute for testing with assistive technology and
with disabled users. This is not legal advice._
