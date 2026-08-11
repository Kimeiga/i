# Attest vs Siteimprove

**Short version: different buyers. Siteimprove is bought by a marketing,
compliance or digital governance function to manage accessibility across a large
web estate. Attest is bought by an engineer to stop regressions in one codebase
and keep a record.**

If your organisation has an accessibility programme, a content team, and hundreds
or thousands of pages across several properties, Siteimprove is a serious product
built for that and we are not a substitute.

## Side by side

| | Siteimprove | Attest |
| --- | --- | --- |
| Buyer | Marketing, compliance, digital governance | Engineer, engineering manager |
| Scope | Whole web estate, including CMS content | One codebase |
| Crawls a live site | Yes | No — scans a repo, plus URLs you list |
| Content quality, SEO, analytics | Yes | No |
| Runs in CI on every pull request | Limited | Yes, that is the entire product |
| Reports what a change did | No | Yes |
| Client/server boundary analysis | No | Yes |
| Buying process | Sales, demo, annual contract | Credit card |
| Onboarding | Weeks | `npx @attestci/cli scan .` |
| Pricing | Quoted; enterprise range | $49–$299/month, published |

## What Siteimprove does better

**Whole-estate governance.** Crawling every page across every property, with
dashboards, role-based access, and progress tracking for non-engineers. We scan
one repository.

**CMS content.** Most accessibility problems on a large site are in content
written by people who are not engineers — link text, heading structure, alt text
in a CMS. Siteimprove finds those and routes them to the person responsible. We
never see them; they are not in your repo.

**The non-engineering audience.** Reports a compliance officer or a marketing
director can read and act on, plus training material. Our output is a pull request
comment.

**Breadth.** Accessibility alongside SEO, content quality, policy, analytics, and
data privacy across an estate.

**The procurement path.** Contracts, security review, an account manager. If your
organisation requires those, that is a real feature and we deliberately do not
have it.

## What Attest does that Siteimprove does not

**Runs before the code merges.** A crawler tells you a page is broken after it is
live. We tell you the pull request introduced it, in the pull request, with the
file and line.

**Sees the source.** A crawler sees rendered HTML. It cannot tell you that a
credentialled fetch is being stored in a shared cache, or that a helper module
became browser code through an import chain, because none of that is visible in
the output.

**Costs what a developer tool costs.** Published pricing, self-serve, cancel from
a settings page.

**Content-hashed evidence with recorded suppressions.** Their reports are
platform reports. Ours are designed to be verifiable by a third party who does not
trust us: identical code produces an identical hash on any machine.

## When you should not use Attest

- **You need to cover a whole web estate**, not one codebase. Use Siteimprove.
- **Most of your content is authored in a CMS.** Your problems are in the content,
  and we never see it.
- **The people who need the reports are not engineers.** Ours is a pull request
  comment.
- **You need an accessibility programme**, with governance, training and
  reporting. We are a check, not a programme.
- **Your procurement requires contracts, security questionnaires, or SOC 2.** We
  do not do any of those and will not start.

## Using both

Common and sensible in an organisation that has both a large content estate and an
engineering team. Siteimprove tells the organisation where it stands; Attest stops
the engineering half getting worse between crawls. They do not overlap much.

---

_We are not affiliated with Siteimprove. This page describes a product we do not
control and whose pricing is not public; check their site. If anything here is out
of date or unfair, [open an issue](https://github.com/attest-ci/attest/issues) and
we will fix it._
