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
pnpm --filter @attestci/web dev      # Next's dev server, for writing pages
pnpm --filter @attestci/web build    # static export into apps/web/out
pnpm --filter @attestci/web preview  # wrangler dev — how it is actually served
```

Use `preview` before believing anything about headers, redirects or 404s. `next
dev` applies `headers()` and `redirects()` from `next.config.ts`; the deployed
site is a static export and ignores both. They live in
[`public/_headers`](public/_headers) and [`public/_redirects`](public/_redirects)
instead, and only `wrangler dev` reads those.

## Scanning it

```bash
pnpm build
pnpm --filter @attestci/web build
node scripts/scan-exported-site.mjs
```

That starts `wrangler dev`, asserts the headers, redirect and 404 page are
applied, then runs all four layers against the pages as served. CI runs the same
script, and so does the deploy workflow — before deploying, not after.

Current result: all four layers run, zero findings — 14 runtime rules over 9
rendered pages.

## Deploying it

The site is a Cloudflare Worker with static assets:
[`wrangler.jsonc`](wrangler.jsonc). Everything is a file except `POST /api/e`,
which [`worker/index.ts`](worker/index.ts) handles.

```bash
pnpm --filter @attestci/web deploy   # wrangler deploy
```

That needs Cloudflare credentials — `wrangler login`, or `CLOUDFLARE_API_TOKEN`
in the environment. [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)
does it on every push to `main` once the `CLOUDFLARE_API_TOKEN` secret and the
`CLOUDFLARE_ACCOUNT_ID` variable are set; until then the job skips itself rather
than failing.

Why Workers rather than Pages: Pages is no longer where Cloudflare puts new
projects, and one route needs code in front of the assets anyway. Why not Vercel:
its Hobby plan prohibits commercial use, so a business site there is $240/year —
12% of the entire spend cap, before a single visitor. See
[`gtm/costs.md`](../../gtm/costs.md).

## The dashboard

Dense and boring on purpose: tables, counts, diffs, hashes. No gauges and **no
score out of 100** — a score is a compliance claim wearing a number, and this
product does not make compliance claims.

A scan where a layer did not run is shown as such, in the same table, because its
finding count is not comparable with the others and hiding that would make a
partial scan look like an improvement.

It currently renders sample data. Wiring it to the API is the next task after the
API is deployed.
