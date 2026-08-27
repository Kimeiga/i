# Configuration

`attest.config.json` in the directory you scan. `npx @attestci/cli init` writes one
with the defaults spelled out.

```json
{
  "include": ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
  "exclude": ["**/generated/**"],
  "urls": ["http://localhost:3000"],
  "failOn": "serious",
  "failOnNewOnly": false,
  "buildDir": ".next",
  "rules": {
    "privacy/over-serialized-client-props": "on",
    "a11y/positive-tabindex": "off"
  }
}
```

## Options

### `include`

Glob patterns for source files. Default `["**/*.{ts,tsx,js,jsx,mjs,cjs}"]`.

### `exclude`

Glob patterns to skip. **Added to the defaults, not replacing them** — replacing
them silently re-enables scanning of `node_modules`, which is never what anyone
means. The defaults already exclude `node_modules`, build output, `*.d.ts`, tests,
stories, and `__mocks__`.

Test and story files are excluded because they intentionally contain broken markup.
Reporting findings nobody will ever fix trains people to ignore the tool.

### `urls`

URLs to render and check with axe-core. Empty means the runtime accessibility layer
does not run, and the report says so. Requires Playwright and a browser.

### `failOn`

`minor` | `moderate` | `serious` | `critical` | `never`. Default `serious`.

Findings at or above this level make `attest scan` exit 1.

### `failOnNewOnly`

When true, and a baseline report is supplied with `--baseline`, only findings absent
from the baseline count towards the exit code. The GitHub Action sets this by
default.

### `buildDir`

Next.js build output to measure for the client-impact figures. Defaults to `.next`
when it exists. If the directory is not there, the metric is omitted rather than
reported as zero — a build that was never measured is not a build with no
JavaScript in it.

### `rules`

Per-rule overrides. `"off"` disables a rule; `"on"` enables an experimental one.

A group prefix disables a whole family:

```json
{ "rules": { "client/": "off" } }
```

## Command-line flags

Flags override the config file.

```
attest scan [dir]
  --url <url>                Repeatable
  --build-dir <path>
  --config <path>
  --json <path>              Full report, canonical JSON, content-hashed
  --sarif <path>             SARIF 2.1.0 for code scanning
  --markdown <path>          Human-readable report
  --baseline <report.json>   Compare against a previous report
  --fail-on <severity>
  --fail-on-new-only
  --chromium-path <path>     Or set ATTEST_CHROMIUM_PATH
  --format terminal|json
  -q, --quiet
```

```
attest diff <base.json> <head.json>
  --format terminal|markdown|json
  -o, --output <path>
  --fail-on-regression
  --file-url-base <url>      Links findings to files in the markdown output
```

```
attest badge <report.json> [-o badge.svg] [--label attest]
attest rules [--json] [--kind static-privacy]
attest explain <rule-id>
attest init [dir] [--force]
```

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | No findings at or above the threshold |
| 1 | Findings at or above the threshold |
| 2 | Usage, configuration, or report format error |

A layer that could not run never changes the exit code. "We did not look" must not
read as "we looked and it was fine".

## Environment variables

| Variable | Purpose |
| --- | --- |
| `ATTEST_CHROMIUM_PATH` | Browser binary for the runtime checks |
| `ATTEST_COMMIT`, `ATTEST_REF`, `ATTEST_REPOSITORY` | Override the git metadata recorded in the report |
| `NO_COLOR` | Disable colour |

`GITHUB_SHA`, `GITHUB_REF_NAME` and `GITHUB_REPOSITORY` are read automatically in
GitHub Actions.

## What is not configurable, and why

**Severity per rule.** Severities are calibrated across the rule set so that
`failOn: serious` means the same thing in every repository. If a rule's severity is
wrong for you, turn it off and say so in an issue — that is a better signal than a
local override nobody else sees.

**The disclaimer and coverage note.** They appear in every report, every export and
every rendered surface, and cannot be removed. A report that can be stripped of its
limits is worth less as evidence, not more.
