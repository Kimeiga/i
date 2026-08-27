# The public scan programme

**This is the marketing plan.** There is no content calendar, no blog, and no "10
accessibility tips" post. There is one repeatable action:

> Pick a well-known open-source React or Next.js project. Scan it. Publish the
> full report as a public page. Open a genuinely useful issue or pull request
> upstream, with a patch where you can.

That produces four things a blog post does not: inbound curiosity, real-world
proof the tool finds real things, goodwill with maintainers, and a citable page
that survives being summarised by an AI answer — because the finding is specific,
attributed and dated.

It also does something more important. **It is the only honest way to find out
whether the rules are any good.** The first three scans in this directory found
two false positives that no fixture had caught, both of which would have been
fatal to adoption. That is worth more than the marketing.

---

## The hard rules

Break any of these and the accessibility community will be done with you
permanently, and they are the only real channel this product has.

1. **Never publish a scan to shame anyone.** The framing is "here is what a tool
   found and here is a patch", never "look at this broken site".
2. **Never contact a company implying legal exposure.** Not in an issue, not in an
   email, not in a DM. That is ambulance-chasing.
3. **Never name a commercial site's violations to generate a sales lead.** Scan
   the open-source repository, never the company's production site.
4. **Never pitch in the issue.** The issue body describes the problem and the fix.
   One line at the end saying which tool found it is the maximum, and only if it
   helps them reproduce it.
5. **Never open an issue you would be annoyed to receive.** If you cannot include
   a patch or a precise reproduction, do not open it.
6. **Say what you got wrong.** If a finding turns out to be a false positive, say
   so on the public page, in the issue, and fix the rule. That is the entire
   reputation strategy.

## Choosing a target

- Open source, permissively licensed, actively maintained.
- React or Next.js, ideally App Router, so the privacy layer has something to say.
- Well known enough that the report is interesting, small enough to read in an
  afternoon.
- **Not** a project whose maintainers have said they do not want drive-by issues.
  Read `CONTRIBUTING.md` first.
- **Not** a project maintained by one unpaid person who will experience a list of
  findings as an attack.

## The process

**1. Clone at a pinned commit.** Record the sha. The report is only citable if
someone else can reproduce it.

```bash
git clone --depth 1 https://github.com/owner/project.git
cd project && git rev-parse HEAD
```

**2. Scan, and write both the JSON and the markdown.**

```bash
attest scan ./project --fail-on never \
  --json  gtm/public-scans/reports/project.json \
  --markdown gtm/public-scans/reports/project.md
```

**3. Read every finding. All of them.** This is the step that cannot be skipped
and the step that makes the whole programme worth doing. For each one, open the
file and decide: is this real, is this real-but-benign, or is this wrong?

Anything you cannot defend to the project's maintainer is not published as a
finding. It is either a bug in a rule or a documentation gap, and both are more
valuable than the page.

**4. Fix the rules first, then re-scan.** Publish the numbers from the fixed
version, and say in the page what changed and why.

**5. Write the page.** Use `TEMPLATE.md`. Lead with what the project does well.
Give the exact commit. Separate "worth fixing" from "correct as written, here is
why the tool flagged it".

**6. Contribute upstream.** One issue, or better, one pull request, for the
highest-value finding — not for all of them. A patch is worth ten issues. Use
`ISSUE-TEMPLATE.md`.

**7. Wait.** Do not follow up. Do not tweet at them. If the issue is closed as
won't-fix, that is a legitimate answer and the page should say so.

## Cadence

One per month is plenty. Three in six weeks at launch, then monthly.

If three published scans cannot produce 20 Action installs within six weeks, the
distribution thesis is wrong, and the honest response is to say so and stop —
not to build more features. That kill criterion is in `PROGRESS.md` with a date.

## The scans so far

| Date | Project | Commit | Findings | Page |
| --- | --- | --- | --- | --- |
| 2026-08-11 | [vercel/commerce](https://github.com/vercel/commerce) | `3761e52` | 8 | [page](2026-08-vercel-commerce.md) |
| 2026-08-11 | [vercel/ai-chatbot](https://github.com/vercel/ai-chatbot) | `c2f8235` | 16 | [page](2026-08-vercel-ai-chatbot.md) |
| 2026-08-11 | [documenso/documenso](https://github.com/documenso/documenso) | `962cffc` | 54 | [page](2026-08-documenso.md) |

Raw reports, with content hashes, are in [`reports/`](reports/).

**Status: none of the upstream issues have been filed yet.** The pages are
written, the patches are not. Filing is a founder decision, not an automated one —
see the note at the bottom of each page.
