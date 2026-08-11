# Attest — GitHub Action

Runs [Attest](https://attest.ci) on a pull request and comments with what changed
about the application's accessibility conformance, privacy boundaries and client
cost.

Attest reports the results of automated checks. It does not determine
compliance, and no tool can. See [what Attest cannot
detect](https://attest.ci/docs/what-attest-cannot-detect).

## Quick start

```yaml
name: attest
on: pull_request

permissions:
  contents: read
  pull-requests: write

jobs:
  attest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          # Needed so the base commit can be checked out for the comparison.
          fetch-depth: 0
      - uses: attest-ci/attest-action@v1
```

That runs the source-level checks: accessibility rules that do not need a
browser, the privacy and placement rules, and the client-cost rules. It posts one
comment and edits it in place on every push.

## Adding the runtime accessibility checks

The runtime rules are axe-core running against your real rendered DOM, so they
need the application running and a browser installed.

```yaml
      - run: npm ci && npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm start &
      - run: npx wait-on http://localhost:3000
      - uses: attest-ci/attest-action@v1
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/checkout
            http://localhost:3000/account
```

Without this the runtime layer is reported as **did not run**, in the comment and
in the report. It is never reported as clean.

## Inputs

| Input | Default | Notes |
| --- | --- | --- |
| `directory` | `.` | Directory to scan |
| `urls` | – | Newline-separated URLs for the runtime checks |
| `build-dir` | `.next` if present | Build output to measure for client cost |
| `fail-on` | `serious` | `minor`, `moderate`, `serious`, `critical`, `never` |
| `fail-on-new-only` | `true` | Fail only on findings absent from the base branch |
| `comment` | `true` | Post/update the pull request comment |
| `sarif-file` | – | Write SARIF here; upload it yourself if you want code scanning |
| `version` | `latest` | Version of `@attestci/cli` to run |
| `token` | `github.token` | Used only to post the comment |

`fail-on-new-only` defaults to `true` deliberately. An existing codebase has
existing findings, and a check that goes red on day one gets removed on day two.

## Outputs

| Output | Notes |
| --- | --- |
| `report` | Path to the head scan report JSON |
| `diff` | Path to the semantic diff JSON, when a base scan was possible |
| `verdict` | `regressed`, `improved`, `mixed`, `unchanged`, or `unknown` |
| `new-findings` | Count of findings introduced by this change |

## Code scanning

```yaml
      - uses: attest-ci/attest-action@v1
        with:
          sarif-file: attest.sarif
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: attest.sarif
```

The SARIF carries our own fingerprints in `partialFingerprints`, so code scanning
dedupes alerts the same way the diff does and unrelated edits do not resurrect
closed ones.

## Permissions

`pull-requests: write` is needed only for the comment. Set `comment: false` and
the action needs nothing beyond `contents: read`.

## When the base cannot be checked out

Shallow clones, first commits and some fork configurations leave nothing to
compare against. The action says so in the comment and reports the current state
instead of inventing a baseline.

## Licence

MIT. Runtime accessibility detection is performed by
[axe-core](https://github.com/dequelabs/axe-core), developed and maintained by
Deque Systems, used under the Mozilla Public License 2.0.
