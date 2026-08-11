# Scanning Documenso

**Project:** [documenso/documenso](https://github.com/documenso/documenso) — open
source document signing
**Commit:** `962cffc9f546be68860be3489247f67255c83a66`
**Scanned:** 11 August 2026 with Attest 0.1.0
**Report:** [JSON](reports/documenso.json) · [Markdown](reports/documenso.md) ·
`sha256:d08d096533182ff3…`
**Findings:** 54, across 1,951 source files

---

Documenso is the largest codebase in this batch by an order of magnitude — 1,951
source files against 66 for Next.js Commerce — and the most interesting to scan
because a document signing product is exactly the kind of thing accessibility law
is about. If a signature flow is unusable with a keyboard, the person who cannot
use it cannot sign a contract.

54 findings across 1,951 files is a low rate. This is a carefully built codebase.

Two things to note about scope before the findings. This is a monorepo whose main
application is **Remix**, not Next.js. Our accessibility and client-cost rules are
plain React analysis and apply fine; the privacy rules that depend on the
`'use client'` boundary have nothing to work with, and reported nothing. That is
correct behaviour, and it means this scan covered less of the codebase than the
number of files suggests. And as with the others, no page was rendered, so no
runtime accessibility check ran.

---

## 25 avoidable round trips

`client/sequential-server-fetch`, moderate — the largest single category, and the
one worth a maintainer's time.

Every one is a route loader awaiting two independent things in sequence:

```ts
// apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx:79
const signatures = await getRecipientSignatures({ recipientId: recipient.id })
const user = await getUserByEmail({ email: recipient.email })
```

Both need `recipient`. Neither needs the other. They run one after the other
anyway, so the page waits for two database round trips where `Promise.all` would
cost one.

```ts
const [signatures, user] = await Promise.all([
  getRecipientSignatures({ recipientId: recipient.id }),
  getUserByEmail({ email: recipient.email }),
])
```

The rule checks the dependency before reporting — if the second call referenced
anything the first bound, the sequence is required and there is no finding. All
25 here are genuinely independent.

They cluster in the places latency is most visible: the recipient signing flow
(`sign.$token+/_index.tsx`, `complete.tsx`), the PDF generation routes
(`audit-log.tsx`, `certificate.tsx`), and the embed routes. A signing page is
loaded by someone who was sent a link and wants to be done; it is a good place to
spend the 100ms.

Several pair a data query with `getTranslations(documentLanguage)`, which is a
particularly clean fix because translations never depend on the document.

---

## Accessibility

**14 unlabelled form controls.** The ones that matter most are in the signature
flow itself:

- `packages/ui/primitives/signature-pad/signature-pad-type.tsx:28`
- `packages/ui/primitives/signature-pad/signature-pad-upload.tsx:133`

These are the inputs a recipient uses to type or upload their signature. An
unlabelled input there is a barrier at the exact moment the product's entire
purpose is being fulfilled.

Also `envelope-editor-title-input.tsx:70`,
`organisation-member-invite-dialog.tsx:424`, and ten more.

**6 icon-only buttons with no accessible name** — `<PlusIcon>` in the checkbox,
dropdown and radio field editors; `<SearchIcon>` in the app header; `<XIcon>` in
the multi-select combobox. Announced as "button". One `aria-label` each.

**8 click handlers with no keyboard equivalent** — `<div onClick>` and
`<span onClick>` in the field editor (`field-item.tsx:285`), the recipient list,
the admin tables, and the multiselect primitive. `packages/ui/primitives/multiselect.tsx:403`
is the highest-leverage one: it is a shared primitive, so the barrier is
inherited by everything that uses it.

**One route entry marked `'use client'`** — `apps/docs/src/app/docs/layout.tsx`,
in the documentation site rather than the product.

---

## What we got wrong

**The first run reported 158 findings. The correct number is 54.**

106 of those 158 were `a11y/label-association` firing on `<Input>` and `<Select>`
— Documenso's own design-system components, which set ids and spread props
internally. Our tag matcher compared case-insensitively, so `<Input>` matched the
DOM element `input`.

In JSX, capitalisation *is* the distinction between a component and a DOM
element. React decides it that way and now we do too. It has a regression fixture
named for this scan.

Left unfixed, that single bug would have made this tool useless on any codebase
with a design system — which is to say, on every codebase worth scanning. It was
not caught by any fixture. It was caught by running the tool against a real
repository, which is the entire argument for this programme existing.

The 14 label findings that remain are on raw `<input>` elements. We checked them.

---

## Upstream

**Not yet filed.** Two candidates:

1. A pull request adding `aria-label` to the six icon-only buttons and labelling
   the two signature-pad inputs. Small, mechanical, clearly good.
2. An issue about `packages/ui/primitives/multiselect.tsx` — the keyboard
   interaction on a shared primitive is a design decision, not a patch to drop on
   a maintainer unannounced.

The 25 sequential fetches are real but are a performance suggestion across many
files, which is not a good drive-by contribution. If it is useful to them at all,
it is useful as a list they can work through, not as a 25-file pull request.

Filing is a founder decision, not an automated one.

---

## Reproducing this

```bash
git clone --depth 1 https://github.com/documenso/documenso.git
cd documenso && git checkout 962cffc
npx @attestci/cli@0.1.0 scan . --fail-on never --json report.json
```

---

_Attest reports the results of automated checks. This scan rendered no pages and
its privacy rules did not apply to the Remix application, so it covered
substantially less than "the codebase". Nothing here is a conformance claim about
Documenso, and nothing here is legal advice._
