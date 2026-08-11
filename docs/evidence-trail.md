# The evidence trail

The detection is the part people look at. The trail is the part they pay for.

A scan tells you the state of the code today. The trail tells you the state of the
code on every day since you installed it, dated and hashed, including the days you
decided something was acceptable and why. When somebody asks *what did you know and
when did you know it* — an auditor, a regulator, a customer's procurement team, a
plaintiff's lawyer — that question has an answer or it does not.

---

## What is in a report

Every `attest scan --json` produces a self-contained document:

```json
{
  "schemaVersion": "1",
  "tool": { "name": "Attest", "version": "0.1.0" },
  "scan": {
    "id": "0c8f…",
    "startedAt": "2026-08-11T09:14:02.113Z",
    "finishedAt": "2026-08-11T09:14:09.884Z",
    "durationMs": 7771
  },
  "target": {
    "repository": "acme/storefront",
    "commit": "9f2c1ab…",
    "ref": "main",
    "urls": ["http://localhost:3000", "http://localhost:3000/checkout"]
  },
  "rulesRun": ["a11y/button-name", "…"],
  "rulesSkipped": [
    { "ruleId": "a11y/color-contrast", "reason": "disabled in config" }
  ],
  "findings": [ … ],
  "suppressed": [ … ],
  "metrics": { "startupJsBytes": { "/": 118023 }, "source": "app-build-manifest.json" },
  "coverage": {
    "layers": [
      { "kind": "runtime-a11y", "ran": true, "rulesRun": 14, "unitsExamined": 2, "unitLabel": "pages rendered" },
      { "kind": "static-privacy", "ran": true, "rulesRun": 7, "unitsExamined": 412, "unitLabel": "source files" }
    ],
    "note": "Automated tooling can evaluate roughly a quarter to a third of WCAG 2.1 success criteria…"
  },
  "disclaimer": "Attest reports the results of automated checks…",
  "contentHash": "sha256:4b1f…"
}
```

Four things in there are doing work that a list of findings does not.

**`coverage.layers`** records what actually ran. A layer that could not run is
`"ran": false` with a reason. This is what stops a clean report being mistaken for a
complete one — and it is the difference between a document that helps you and a
document that a competent opponent takes apart.

**`rulesSkipped`** records every rule that did not run and why: disabled in config,
experimental and not enabled, or threw an exception. A rule that crashed is recorded
as a skip rather than silently producing nothing.

**`suppressed`** records findings a developer waived, with the reason they gave. See
[suppressions](suppressions.md).

**`contentHash`** is a SHA-256 over the canonical form of everything describing what
was found.

---

## The content hash

```
sha256(canonical_json({
  schemaVersion, tool, urls, rulesRun, rulesSkipped,
  findings, suppressed, metrics, coverage
}))
```

Deliberately **excluded**: the scan id, the timestamps, the duration, the absolute
root directory, and the git revision. Those are recorded alongside the hash, not
inside it.

The property that buys you is worth stating precisely: **two scans of identical code
produce an identical hash**, on a different machine, on a different day, from a
different checkout path, on a different branch. So a third party can take your
source at a commit, run the same version of the tool, and get the same hash — or not.
A hash that changes when the clock changes proves nothing.

The tool version *is* in the hash, because a different engine version is a different
measurement and should not silently compare equal.

Canonical JSON means sorted keys, dropped `undefined`, and a rejection of non-finite
numbers, so the serialisation cannot vary between machines or engine versions.

### Verifying one

```bash
attest scan . --json report.json   # writing it verifies as a side effect
```

`attest` recomputes the hash whenever it reads a report and refuses to use one whose
contents no longer match:

```
Attest: Report content hash does not match its contents. The file has been modified
since it was produced, or was written by a different tool version. Re-run the scan
rather than trusting this file.
```

That check is on by default everywhere a report is read — `diff`, `badge`,
`--baseline`, and the hosted ingest endpoint.

---

## Append-only storage

In the hosted service, scan records are **insert-only**. There is no update path and
no delete path in the API, and the database enforces it with a trigger rather than a
convention:

```sql
create trigger scans_append_only
  before update or delete on scans
  for each row execute function reject_mutation();
```

Each record stores the report, its hash, the previous record's hash for that
repository, and a hash chain link — so removing or altering a record in the middle
breaks every link after it. Verification walks the chain and tells you exactly where
it broke.

Retention is seven years by default, which is longer than most limitation periods
and long enough to be useful for the thing this is for.

---

## Exports

The paid tier produces two artefacts from the same data:

**Signed JSON** — the reports, the hash chain, and a detached signature over the
export manifest. The public key is published at a stable URL. Anyone can verify the
export without an account and without trusting us; the verification instructions
travel inside the export.

**PDF** — the same content, formatted for people who will not open a JSON file:
conformance state over time, what changed and when, what was suppressed and why, and
the coverage statement on every page. It states what the automated checks covered and
what they did not, because an export that overstates its scope is worse than no
export.

---

## What this is not

It is not a certificate. It is not an audit. It is not a conformance determination,
and nothing in an export says you are compliant — because that is not a thing a scan
can establish.

It is a dated, verifiable record of what an automated tool found, what it did not
look at, and what you decided about it. That is a smaller claim than a certificate,
and unlike a certificate it is one that survives someone checking.
