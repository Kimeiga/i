# Attest web — landing, docs and dashboard

**Proprietary.** See [`../LICENSE`](../LICENSE).

## The rules this site follows

**It must pass its own scan**, with every layer running, including axe-core
against the rendered pages. Shipping an accessibility tool on an inaccessible
site would be the whole product's argument, refuted.

**No third parties.** No analytics, no session recording, no chat widget, no
fonts from someone else's origin, no embeds. Loading a page here puts an entry in
nobody's log but ours. That is also why there is no cookie banner: there is
nothing to consent to.

**No animation and no marketing furniture.** The audience is engineers, and every
scroll-jack costs credibility that the copy is trying to build.

**The coverage limit is above the fold**, in body text, at the same size as
everything else. `scripts/check-forbidden-words.mjs` runs over this directory in
CI, so a page that drifts into claiming a compliance outcome does not ship.

## Content comes from the repository

Documentation renders from `docs/*.md` at build time. Public scan pages render
from `gtm/public-scans/*.md`. Neither is duplicated here.

That matters most for the rule reference: `docs/rules/*.md` is generated from the
rule definitions and their real fixture files, and CI fails when it is stale — so
the published rule pages cannot disagree with the code that implements them.

## Running it

```bash
pnpm --filter @attestci/web dev
pnpm --filter @attestci/web build
```

## Scanning it

```bash
pnpm --filter @attestci/web build
pnpm --filter @attestci/web start &
node packages/cli/dist/bin.js scan apps/web \
  --url http://localhost:3000/ \
  --url http://localhost:3000/pricing \
  --url http://localhost:3000/dashboard \
  --url http://localhost:3000/docs/what-attest-cannot-detect
```

Current result: all four layers run, zero findings.

## The dashboard

Dense and boring on purpose: tables, counts, diffs, hashes. No gauges and **no
score out of 100** — a score is a compliance claim wearing a number, and this
product does not make compliance claims.

A scan where a layer did not run is shown as such, in the same table, because its
finding count is not comparable with the others and hiding that would make a
partial scan look like an improvement.

It currently renders sample data. Wiring it to the API is the next task after the
API is deployed.
