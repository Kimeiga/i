# Report schema

`schemaVersion: "1"`. The full TypeScript definitions are in
[`packages/core/src/types.ts`](https://github.com/attest-ci/attest/blob/main/packages/core/src/types.ts).

Reports are written as canonical JSON — sorted keys, `undefined` dropped — so the
bytes on disk are the bytes that were hashed.

## Top level

| Field | Type | Notes |
| --- | --- | --- |
| `schemaVersion` | `"1"` | Reports with an unknown version are rejected, not guessed at |
| `tool` | `{ name, version }` | Included in the content hash |
| `scan` | `{ id, startedAt, finishedAt, durationMs }` | Excluded from the content hash |
| `target` | `{ rootDir, repository?, commit?, ref?, urls[] }` | Only `urls` is hashed |
| `rulesRun` | `string[]` | Sorted |
| `rulesSkipped` | `{ ruleId, reason }[]` | Disabled, experimental, or threw |
| `findings` | `Finding[]` | Sorted deterministically |
| `suppressed` | `SuppressedFinding[]` | Waived in source, kept in the record |
| `metrics` | `BuildMetrics` | Omitted rather than zeroed when not measured |
| `coverage` | `CoverageStatement` | What ran and what did not |
| `disclaimer` | `string` | Always present |
| `contentHash` | `sha256:…` | See [the evidence trail](evidence-trail.md) |

## `Finding`

```ts
{
  ruleId: string
  kind: 'runtime-a11y' | 'static-a11y' | 'static-privacy' | 'client-impact'
  severity: 'minor' | 'moderate' | 'serious' | 'critical'
  title: string          // rule-level, copied in so a finding is self-contained
  message: string        // this instance
  location: SourceLocation | DomLocation | ArtifactLocation
  evidence?: string      // the offending code, truncated
  help: string           // what to do about it
  helpUrl: string
  standards: StandardRef[]
  fingerprint: string    // stable across unrelated edits
  surface: string        // 'checkout/PaymentForm'
  boundary?: { subject, from, to }
}
```

### `location`

```ts
{ kind: 'source', file, line, column, endLine?, endColumn? }
{ kind: 'dom', url, selector, html? }
{ kind: 'artifact', artifact, entry? }
```

`file` is repo-relative with POSIX separators. Absolute paths never appear in a
report, so the same code hashes the same on any machine.

### `standards`

```ts
{ framework: 'wcag21' | 'en301549' | 'privacy-property', id, level?, title, url? }
```

`privacy-property` means an Attest definition, not a numbered requirement in a
published standard. No published standard enumerates "session-scoped data must not
enter a shared cache"; labelling it as ours is more useful than citing a regulation
that does not say it.

### `boundary`

Set by privacy rules that can name the transition they found. This is what renders
as `customer_profile: session-private → reachable from shared cache` — one line a
non-engineer can act on.

## `coverage`

```ts
{
  layers: Array<{
    kind: RuleKind
    ran: boolean
    reason?: string        // present when ran is false
    rulesRun: number
    unitsExamined: number
    unitLabel: string      // 'source files', 'pages rendered'
  }>
  note: string
}
```

The most important field in the schema is `ran`. A consumer that ignores it will
report "no accessibility violations" for a scan that never opened a browser.

## The semantic diff

`attest diff --format json`:

```ts
{
  schemaVersion: '1'
  base: { scanId, contentHash, commit? }
  head: { scanId, contentHash, commit? }
  accessibility: { added, removed, persisting, bySurface }
  privacy:       { added, removed, persisting, boundaryChanges }
  clientImpact:  { added, removed, persisting, startupJsBytesDelta?, startupJsByRouteDelta? }
  verdict: 'regressed' | 'improved' | 'mixed' | 'unchanged'
  incomparableLayers: RuleKind[]
  disclaimer: string
}
```

`incomparableLayers` lists layers that ran on only one side. **Findings from those
layers are excluded from `added` and `removed` entirely.** Reporting twelve
accessibility violations as fixed because the head scan could not launch a browser
would be the most damaging bug this product could ship, so the diff refuses to
compare what it cannot compare.

## SARIF

`attest scan --sarif` emits SARIF 2.1.0.

Our fingerprint travels in `partialFingerprints.attestFingerprint`, so GitHub code
scanning dedupes alerts the same way our diff does. Without it, code scanning
re-fingerprints by line and unrelated edits resurrect closed alerts.

Layers that did not run appear in `runs[0].invocations[0].toolExecutionNotifications`,
so a consumer reading only the SARIF still learns the scan was partial.

## Compatibility

`schemaVersion` changes only on a breaking change. Additive fields do not bump it,
and readers should ignore unknown fields.

Reports produced by a different tool version have a different content hash by
design: a different engine is a different measurement, and it should not silently
compare equal.
