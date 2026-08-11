# Changelog

Public and permanent. Anything that changes what a scan reports is a user-visible
change and goes here, including rule changes that produce fewer findings.

## Unreleased — 0.1.0

First working version. Not yet published to npm.

### Added

- **Rule engine and report schema** (`@attestci/core`). Content-hashed reports,
  fingerprints that survive unrelated edits, an honest coverage statement, and a
  semantic diff that refuses to compare layers that ran on only one side.
- **14 runtime accessibility rules** wrapping axe-core, with WCAG 2.1 criterion
  mappings, tested against a real browser.
- **6 static accessibility rules** that run without a browser.
- **8 privacy and placement rules**, including session data entering a shared cache,
  server-side environment variables reaching the browser through the client import
  graph, and non-idempotent requests under automatic retry.
- **2 client-impact rules**, plus startup-JavaScript measurement from Next.js build
  manifests.
- **`attest` CLI**: `scan`, `diff`, `badge`, `rules`, `explain`, `init`. Terminal,
  JSON, SARIF 2.1.0 and markdown output.
- **GitHub Action** with a semantic-diff pull request comment, edited in place.
- **Suppressions** that are recorded in the report with their reason rather than
  dropped.

### Notes on what is deliberately absent

- No overlay, widget, or runtime "fix" script. There never will be one.
- No compliance claim anywhere in the product. CI fails the build if one appears.
- No telemetry in the CLI.

---

## Planned

- Hosted evidence store, trend dashboard, and signed exports.
- WCAG 2.2 criterion tags when EN 301 549 v4.1.1 is referenced in the Official
  Journal. Existing findings will be tagged with both rather than silently
  re-labelled. See [regulatory context](regulatory-context.md).
