# Launch

What is left, in order, with an honest split between what only the founder can
do and what is engineering. **Nothing here is a feature.** The product is
sufficient to launch; the remaining work is legal, administrative and
distributional, which is the normal shape of this stage and the part that is
easiest to avoid by writing more code.

---

## Gate 0 — Before anything else. Founder only. One hour.

**Read your employment agreement.** IP assignment and outside-work clauses. See
[`gtm/legal/founder-only-tasks.md`](gtm/legal/founder-only-tasks.md).

If your employer owns this, every subsequent hour is wasted, and this is the
cheapest possible way to find out. It should have been the first thing done
rather than the last thing written down.

**Do not proceed past this gate until it is answered.**

---

## Gate 1 — Names and money. Founder only. Two hours, ~$50.

| | Why it blocks | Cost |
| --- | --- | --- |
| Claim `@attestci` on npm | Nothing can be published without it | free |
| Create the GitHub organisation | Marketplace paid plans require org ownership | free |
| Buy the domain | `attest.ci` is a placeholder in `PRODUCT_URL`; every published docs link is dead until it resolves | **$9.99/yr** |
| Create `attest-ci/attest-action` (empty) | The Marketplace only lists an action whose `action.yml` is at a repository root | free |

`attest` is taken on npm (v1.0.1, 2016). `@attestci` and `attest-ci` were
unclaimed on 2026-08-11 — verify again before announcing, and claim the same
hour you check.

**Do not buy `attest.ci`.** Checked 2026-08-11: it was not offered by the
registrar at all. `.ci` is Côte d'Ivoire's ccTLD, is not universally carried, and
ccTLDs of that shape commonly run $60–200/yr. Available and cheap instead:
`attestci.dev` at **$9.99**, `attestci.com` at **$11.25**. `.dev` is HSTS-preloaded,
so it is HTTPS-only by construction — a reasonable fit for a security-adjacent
developer tool.

When the domain changes, it is one constant: `PRODUCT_URL` in
`packages/core/src/product.ts`. Full ledger in [`gtm/costs.md`](gtm/costs.md).

---

## Gate 2 — Publish. Engineering, ready to run. One session.

Everything for this exists and is tested:

```bash
pnpm check                              # build, claims, rubric, tests, docs
node scripts/check-versions.mjs         # all five packages agree
node scripts/smoke-test-packages.mjs    # packs, installs clean, runs a real scan
git tag v0.1.0 && git push --tags       # triggers release.yml and sync-action.yml
```

Two things this pipeline knows that are not obvious, both learned the hard way:

**Publish with `pnpm`, never `npm`.** npm does not rewrite the `workspace:*`
protocol and produces a tarball that fails to install with
`EUNSUPPORTEDPROTOCOL`. This was found by installing a packed tarball into a
clean project, not by reading the manifest — the workspace build, the types and
the tests were all fine. `scripts/guard-publish.mjs` now blocks the npm path.

**The Action needs its own repository.** GitHub Marketplace only lists an action
whose `action.yml` is at a repository root; sub-folder actions work when
referenced directly but are never listed.
[`sync-action.yml`](.github/workflows/sync-action.yml) mirrors
`packages/action` to the standalone repo on each tag. Until that repo exists,
the interim reference is `uses: kimeiga/i/packages/action@main`.

**Required secrets:** `NPM_TOKEN` (automation token), `ACTION_REPO_TOKEN` (a PAT
with contents:write on the mirror), and the repository variable `ACTION_REPO`.
The sync workflow skips itself until `ACTION_REPO` is set, so nothing breaks
before then.

**Publishing is one-way.** npm allows unpublish for 72 hours and then never
again. Run the dry run first.

---

## Gate 3 — Be reachable. Half a session, $0/month if hosted carefully.

The docs are the product's surface area and currently exist only in this
repository.

- **Deploy `apps/web`.** [`vercel.json`](vercel.json) is written: build from the
  repo root, output `apps/web/.next`, with CSP and HSTS headers set.

  **But Vercel's Hobby plan prohibits commercial use**, so a business site there
  costs $20/month per seat — $240/year, or 12% of the whole cap, spent on
  deployment convenience before a single visitor exists. 54 of the site's 55
  routes are prerendered and the one dynamic route is an event sink that is off
  by default, so it can be hosted free on Cloudflare Pages, GitHub Pages or
  Netlify, all of which permit commercial use on their free tiers. Start there.
- **Set up `support@` and `security@`.** Forwarding addresses are fine. An
  unmonitored address is worse than none, and the [support
  system](gtm/support.md) already promises best-effort email and nothing more.
- **Publish the legal pages** — after Gate 4, not before.

The hosted API is **not** part of this gate. Nothing is for sale yet and a
running service with no customers is a bill and an attack surface.

---

## Gate 4 — Legal. Founder only, plus a solicitor. ~$300–800.

Two hours of a solicitor's review, not a drafting engagement. The templates are
written: [`terms-of-service.md`](gtm/legal/terms-of-service.md),
[`privacy-policy.md`](gtm/legal/privacy-policy.md), [`dpa.md`](gtm/legal/dpa.md),
[`subprocessors.md`](gtm/legal/subprocessors.md).

Tell them the product reports automated accessibility checks and explicitly does
**not** determine conformance. That distinction is the whole positioning and a
lawyer optimising for caution may blur it in the wrong direction.

**Check the privacy policy against the code before it goes live.** It currently
describes a hosted service that is not deployed and event capture that is off by
default. `apps/web/lib/events.ts` and `apps/api/src/` are the authority; the
document has to follow them.

---

## Gate 5 — Distribution. This is the actual business risk.

Everything above is administrative. This is the part that decides whether there
is a company.

1. **Run the pre-traffic tests.** [`pre-traffic-tests.md`](gtm/conversion/pre-traffic-tests.md).
   Hours, not money. They can falsify most of the current positioning, including
   the largest bet in the rewrite — whether publishing our own false positives
   reads as honesty or as "this tool is buggy".
2. **Post to the accessibility community first.** [The
   draft](gtm/launch/accessibility-community.md) leads with limitations, credits
   Deque, asks for criticism rather than signups. Fix whatever it surfaces
   **before** Show HN.
3. **File the three upstream issues.** The scans are written and the patches are
   small. Founder decides each one — automated filing is never appropriate.
4. **Show HN**, once the community post has not gone badly.
5. **Then** the six-week clock on the kill criterion starts.

### The kill criterion, with a date

> If three published scan reports cannot produce **20 Action installs within six
> weeks** of the third going up, the distribution thesis is wrong.

The honest response is to say so — here and publicly — not to build more rules.
Write the date in `PROGRESS.md` on the day the third scan is published.

---

## Gate 6 — Only after somebody wants it.

Do not do any of this before Gate 5 produces installs.

- Deploy the hosted API (`apps/api/Dockerfile` is written; it needs a Postgres
  and about $5–20/month). Note that evidence storage is append-only with
  seven-year retention: measured at ~34 KB per report, one active Team account
  is roughly 5 GB/year, so a 500 MB free-tier database is exhausted by a single
  busy repository in about a month. Generate the signing keypair and **publish the public
  key at a stable URL before signing anything with it.**
- Set up Paddle. [`mor-setup.md`](gtm/legal/mor-setup.md). Approval can take
  days, so apply before you need it — but not before there is anything to sell.
- Wire the dashboard to the API. It currently renders sample data and says so.
- GitHub Marketplace paid listing: requires org ownership, 2FA, and a verified
  domain. We could not confirm whether an install-count threshold also applies;
  it is marked `[UNVERIFIED]` in [`mor-setup.md`](gtm/legal/mor-setup.md).

---

## What not to do

Every item here will feel productive and none of it moves the business.

- **More rules.** Thirty is more than enough to find out whether anyone wants
  this. Rule thirty-one is procrastination with a test suite.
- **Phase 4 autofix.** Explicitly blocked on revenue, by design.
- **A hosted "scan any URL" service.** It is the highest-leverage thing to build
  *later* — the strongest possible ungated first value — and building it before
  anyone has installed the free CLI is optimising a funnel with no traffic in it.
- **SOC 2, SAML, contracts, questionnaires.** On the [do-not-build
  list](gtm/positioning.md) for a reason.
- **Rewriting the landing page again.** It has not been read by a single
  practitioner. Test it before touching it.

---

## Total cost to launch

| | |
| --- | --- |
| Domain | ~$10 |
| Solicitor review | ~$300–800 |
| Hosting (web only, through Gate 5) | $0 free tier, or $240/yr on Vercel Pro |
| npm, GitHub, Paddle setup | $0 |
| **Total against the $2,000 cap** | **~$310–830** |

The remaining ~$1,200–1,700 is the buffer for the hosted service at Gate 6, and
it should not be spent before then. Full breakdown, including the storage growth
model and the runaway risks, in [`gtm/costs.md`](gtm/costs.md).

---

## The honest summary

The engineering is done and further along than the calendar suggests. Gates 0
through 4 are roughly **one week of evenings plus a solicitor's invoice**, and
almost none of it is code.

Gate 5 is the whole risk, and no amount of work at the earlier gates reduces it.
