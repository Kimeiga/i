# Getting started

Five minutes to a first report. No account, no signup, no telemetry.

---

## 1. Run it

```bash
npx @attestci/cli scan .
```

That is the whole first step. It reads your source, runs the accessibility rules
that do not need a browser, the privacy and placement rules, and the client-cost
rules, and prints what it found.

You will get something like:

```
Attest 0.1.0
7 findings (1 critical, 4 serious, 2 moderate)

checkout/PaymentForm
  serious  This <input> has no id and no accessible name, so no <label> can be
           associated with it. The placeholder "Card number" is not a label.
    src/components/checkout/PaymentForm.tsx:41:9  a11y/label-association
    fix: Give the control an id and point a <label htmlFor> at it, wrap it in a
         <label>, or set aria-label when there is no visible caption.

lib/api
  critical `customer_profile` is fetched with a authorization header and
           next: { revalidate: 3600 }, which stores the response in the shared
           Data Cache.
    src/lib/api.ts:18:20  privacy/session-data-in-shared-cache

Checks that did not run
  Runtime accessibility (axe-core in a browser) did not run: no URLs were given,
  so no page was rendered. Pass --url to check a running application.
```

Note the last block. A layer that could not run is always reported as *did not
run*, never as clean.

---

## 2. Add the runtime accessibility checks

The runtime rules are [axe-core](https://github.com/dequelabs/axe-core) running
against your real rendered DOM, so they need your application running and a
browser installed.

```bash
npm i -D playwright
npx playwright install chromium

npm run build && npm start &
npx @attestci/cli scan . --url http://localhost:3000 --url http://localhost:3000/checkout
```

Point it at the pages that matter: your highest-traffic route, your checkout, your
account area, and anything with a form. Three or four URLs is a good start. Pages
you do not list are not scanned, and the report says which ones were.

---

## 3. Add it to CI

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
          fetch-depth: 0     # so the base commit can be scanned for comparison
      - uses: attest-ci/attest-action@v1
```

On every pull request you get one comment, edited in place on each push, saying
what changed:

```
Accessibility conformance changed
checkout/PaymentForm: 3 new WCAG 2.1 AA violations (label association, focus order)

Privacy boundary changed
customer_profile: session-private → reachable from shared cache

Client impact
+18 KB startup JavaScript, one new sequential server fetch
```

`fail-on-new-only` is on by default, so an existing codebase adopts the check
without having to fix everything first.

---

## 4. Configure it

```bash
npx @attestci/cli init
```

Writes `attest.config.json`:

```json
{
  "include": ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
  "exclude": ["**/generated/**"],
  "urls": [],
  "failOn": "serious",
  "failOnNewOnly": false,
  "rules": {}
}
```

Your `exclude` patterns are added to the defaults rather than replacing them, so
you cannot accidentally re-enable scanning of `node_modules`.

See [configuration](configuration.md) for every option.

---

## 5. Suppress what you have decided to accept

```ts
// attest-disable-next-line privacy/session-data-in-shared-cache -- catalogue is public, token is for rate limiting
```

The reason is not optional in spirit and is recorded in the report. **Suppressed
findings stay in the evidence trail**, with the reason and the date. That is the
point: a suppression is a decision, and the trail keeps decisions. It is not a way
to make something disappear from the record.

See [suppressions](suppressions.md).

---

## What you now have, and what you do not

You have automated coverage of the mechanical part of accessibility conformance, a
check that stops it regressing, findings in a layer nothing else looks at, and a
timestamped, content-hashed record of every scan.

You do not have a conformance determination. Automated tooling can evaluate roughly
a quarter to a third of WCAG 2.1 success criteria; the rest — whether alt text is
*correct*, whether focus goes somewhere sensible, whether an error message helps —
needs a person. Read [what Attest cannot
detect](what-attest-cannot-detect.md) before you tell anyone what this covers.

Attest does not make you compliant, and no tool can.

---

## Next

- [Rules](rules/index.md) — all 30, with code that triggers each one and code that does not
- [Configuration](configuration.md)
- [The evidence trail](evidence-trail.md) — what is recorded and how to verify it
- [Regulatory context](regulatory-context.md) — what was verified, when, and against which source
- [What Attest cannot detect](what-attest-cannot-detect.md)
