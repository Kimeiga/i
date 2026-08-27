# Suppressions

Every tool needs an escape hatch. What makes this one different is that using it
leaves a record.

## The three directives

```ts
// attest-disable-next-line a11y/label-association -- labelled by the parent Field component
<input type="text" name="q" />

const x = compute() // attest-disable-line privacy/async-work-outlives-request -- fire and forget is intended

// attest-disable-file privacy/server-env-in-client-graph -- build-time only, tree-shaken out
```

The rule id may be omitted to waive every rule at that location, and several ids
may be comma-separated:

```ts
// attest-disable-next-line a11y/positive-tabindex, a11y/click-without-keyboard -- legacy widget, tracked in ENG-4471
```

Everything after `--` is kept verbatim as the reason.

## Suppressed findings stay in the report

This is the part that matters, and it is not how most linters work.

```json
{
  "suppressed": [
    {
      "ruleId": "privacy/session-data-in-shared-cache",
      "surface": "lib/api",
      "severity": "critical",
      "reason": "catalogue is public, token is for rate limiting",
      "directive": "disable-next-line",
      "fingerprint": "8c2f…"
    }
  ]
}
```

They appear in the JSON report, in the markdown report, and in the count shown at
the end of a terminal run. They are included in the content hash.

The reasoning: the question an auditor, a regulator, or opposing counsel asks is
*what did you know and what did you do about it*. "A developer waived it on 3 March
with this reason" is a good answer. A report that never mentions it is not an
answer at all — and a tool whose output can be silenced invisibly is worthless as
evidence, which is most of what this product is.

So: suppress freely, and write a real reason. The reason is the artefact.

## Turning a rule off entirely

When a rule is wrong for your codebase rather than wrong at one site:

```json
{ "rules": { "a11y/positive-tabindex": "off" } }
```

A disabled rule is recorded in `rulesSkipped` with the reason `disabled in config`.
Same principle: the report says what did not run.

## Experimental rules

Rules marked experimental are off unless you enable them:

```json
{ "rules": { "privacy/over-serialized-client-props": "on" } }
```

A rule is marked experimental when we know it over-reports on some shapes of
codebase. Saying so is cheaper than losing you to a false positive.

## What suppressions cannot do

They cannot remove a finding from a report that has already been produced. Reports
are append-only in the hosted evidence store and content-hashed everywhere; editing
one breaks its hash and `attest` will refuse to read it.

That is deliberate. An evidence trail you can edit is not an evidence trail.
