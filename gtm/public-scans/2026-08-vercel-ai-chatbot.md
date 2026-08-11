# Scanning the Vercel AI Chatbot template

**Project:** [vercel/ai-chatbot](https://github.com/vercel/ai-chatbot)
**Commit:** `c2f8235e1f3ea903ad8b7f61447c4f74164b5c58`
**Scanned:** 11 August 2026 with Attest 0.1.0
**Report:** [JSON](reports/ai-chatbot.json) · [Markdown](reports/ai-chatbot.md) ·
`sha256:1e5e8f784ce3ce6f…`
**Findings:** 16, across 150 source files

---

This is the template a very large number of AI products started from, which makes
its defaults worth looking at closely. Source-only scan: we did not stand the
application up, so no runtime accessibility checks ran and nothing here says
anything about contrast or computed accessible names.

Sixteen findings across 150 files. The two most interesting are both in the same
route handler and neither is an accessibility issue.

---

## Work that may never run

**`app/(chat)/api/chat/route.ts:238`** — `privacy/async-work-outlives-request`,
moderate

```ts
setTimeout(() => {
  getModelAvailability(chatModel).then((availability) => {
    if (availability === 'impacted') {
      writeWaitingStatus('health', `${model…`)
    }
  })
}, /* … */)
```

**`app/(chat)/api/chat/route.ts:342`** — same rule

```ts
updateChatTitleById({ chatId: id, title })   // not awaited
```

Both schedule work the response does not wait for, inside a route handler. On a
serverless runtime the execution context is frozen or destroyed once the response
is returned, so this work runs *sometimes*: on a warm instance handling other
traffic it completes, on a cold one it disappears.

The second one is the one to care about. `updateChatTitleById` is a database
write. It happens or it does not, depending on infrastructure timing nobody
controls, and the failure produces no error and no log line — just a chat that
occasionally keeps its default title. That bug report reads "sometimes titles
don't save", which is among the most expensive shapes a bug can have.

This is a deliberate trade in a template, and in a streaming route it is a
defensible one — the response is long-lived, so the work usually does complete.
It is still worth a comment saying so, and worth `waitUntil` on runtimes that
provide it. Our finding is exactly the sort of thing that should be suppressed
with a reason rather than fixed, if the reason is real:

```ts
// attest-disable-next-line privacy/async-work-outlives-request -- streaming response keeps the context alive
```

That suppression, with that reason, then lives in the evidence trail.

## An avoidable round trip

**`app/(chat)/api/models/route.ts:10`** — `client/sequential-server-fetch`,
moderate

`getCapabilities()` and `getAllGatewayModels()` are awaited one after the other,
and neither uses the other's result. Two round trips where `Promise.all` costs
one. The rule checks the dependency before reporting, which is what stops it
firing on sequences that genuinely have to be sequential.

## Environment variables that are `undefined` in the browser

Four instances, all the same shape as the one in
[Next.js Commerce](2026-08-vercel-commerce.md):

| File | Variable | Reaches the browser via |
| --- | --- | --- |
| `lib/constants.ts:6` | `PLAYWRIGHT_TEST_BASE_URL` | `components/chat/preview.tsx` |
| `lib/constants.ts:7` | `PLAYWRIGHT` | `components/chat/preview.tsx` |
| `lib/constants.ts:8` | `CI_PLAYWRIGHT` | `components/chat/preview.tsx` |
| `lib/ai/models.ts:109` | `IS_DEMO` | `components/chat/multimodal-input.tsx` |

The `PLAYWRIGHT` ones are test-environment flags and reading them as `undefined`
in a browser is harmless. `IS_DEMO` is more interesting: if any client-side code
branches on it, that branch is permanently false in the browser regardless of how
the variable is set.

## Accessibility

Five icon-only buttons with no accessible name — `<CrossIcon>`,
`<CrossSmallIcon>`, `<ChevronLeftIcon>` — in the artifact close button, the
attachment preview, the suggestion dismiss, and the version footer. Each is
announced as "button" with no indication of what it does. Every one is a
one-attribute fix:

```tsx
<button type="button" aria-label="Close artifact" onClick={…}>
  <CrossIcon aria-hidden="true" />
</button>
```

Plus one `<div onClick>` with no key handling in `document-preview.tsx:190`, and
one unlabelled input in `multimodal-input.tsx:484`.

Two route entry points — `app/(auth)/login/page.tsx` and `register/page.tsx` —
carry `'use client'`, which moves their whole subtree into the browser bundle.
For a login form that is a reasonable call and the finding is moderate for that
reason.

---

## What we got wrong

**This scan initially reported a critical false positive**, and it is worth being
specific because it is the most useful thing on this page.

The first run said `lib/db/queries.ts` — which imports `server-only` — was
reachable from the browser through:

```
components/chat/data-stream-provider.tsx → lib/types.ts → lib/ai/tools/request-suggestions.ts → lib/db/queries.ts
```

That chain is not real. Every link in it is an `import type`, erased at compile
time, producing no runtime dependency at all. Our client graph followed type-only
imports, so a well-organised `lib/types.ts` looked like it was dragging the
database layer into the browser.

Reported as critical. On correct code. On the exact pattern every codebase with a
shared types module uses.

It is fixed ([commit](https://github.com/attest-ci/attest)), it has a named
regression fixture, and the same run also fixed a case-insensitive tag match that
was treating `<Input>` components as `<input>` elements. The numbers on this page
are from the fixed version: 23 findings before, 16 after.

We publish that because a tool whose false positives you only find out about
yourself is a tool you should not install.

---

## Upstream

**Not yet filed.** The five `aria-label` additions are the obvious pull request —
small, mechanical, and a clear improvement. Filing is a founder decision.

---

## Reproducing this

```bash
git clone --depth 1 https://github.com/vercel/ai-chatbot.git
cd ai-chatbot && git checkout c2f8235
npx @attestci/cli@0.1.0 scan . --fail-on never --json report.json
```

---

_Attest reports the results of automated checks. This scan did not render a
single page, so it says nothing about contrast, computed accessible names, focus
behaviour, or anything else that requires the application to be running. Nothing
here is a conformance claim about vercel/ai-chatbot, and nothing here is legal
advice._
