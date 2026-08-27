# Attest scan report

- Tool: Attest 0.1.0
- Scanned: 2026-08-11T18:25:59.830Z
- Repository: vercel/ai-chatbot
- Commit: `c2f8235e1f3ea903ad8b7f61447c4f74164b5c58`
- Report hash: `sha256:1e5e8f784ce3ce6f7ec00da684656879903f0228d84750b29636ebf6861ece74`

## What ran

| Layer | Ran | Rules | Examined |
| --- | --- | --- | --- |
| Static accessibility (source analysis) | yes | 6 | 150 source files |
| Runtime accessibility (axe-core in a browser) | no — no URLs were given, so no page was rendered. Pass --url to check a running application. | 0 | 0 n/a |
| Privacy and placement (source analysis) | yes | 7 | 150 source files |
| Client impact | yes | 2 | 150 source files |

## Findings

| Severity | Rule | Surface | Where | What |
| --- | --- | --- | --- | --- |
| serious | [a11y/click-without-keyboard](https://attest.ci/docs/rules/a11y-click-without-keyboard) | `components/chat/document-preview.tsx` | `components/chat/document-preview.tsx:190` | <div> handles onClick but no key events, so it cannot be activated from a keyboard. |
| serious | [a11y/control-without-accessible-name](https://attest.ci/docs/rules/a11y-control-without-accessible-name) | `components/chat/artifact-close-button.tsx` | `components/chat/artifact-close-button.tsx:19` | This <button> contains only <CrossIcon> and exposes no name, so it is announced as "button". |
| serious | [a11y/control-without-accessible-name](https://attest.ci/docs/rules/a11y-control-without-accessible-name) | `components/chat/preview-attachment.tsx` | `components/chat/preview-attachment.tsx:46` | This <button> contains only <CrossSmallIcon> and exposes no name, so it is announced as "button". |
| serious | [a11y/control-without-accessible-name](https://attest.ci/docs/rules/a11y-control-without-accessible-name) | `components/chat/suggestion.tsx` | `components/chat/suggestion.tsx:53` | This <button> contains only <CrossIcon> and exposes no name, so it is announced as "button". |
| serious | [a11y/control-without-accessible-name](https://attest.ci/docs/rules/a11y-control-without-accessible-name) | `components/chat/version-footer.tsx` | `components/chat/version-footer.tsx:111` | This <button> contains only <ChevronLeftIcon> and exposes no name, so it is announced as "button". |
| serious | [a11y/control-without-accessible-name](https://attest.ci/docs/rules/a11y-control-without-accessible-name) | `components/chat/version-footer.tsx` | `components/chat/version-footer.tsx:122` | This <button> contains only <ChevronRightIcon> and exposes no name, so it is announced as "button". |
| serious | [a11y/label-association](https://attest.ci/docs/rules/a11y-label-association) | `components/chat/multimodal-input.tsx` | `components/chat/multimodal-input.tsx:484` | This <input> has no id and no accessible name, so no <label> can be associated with it. |
| moderate | [client/route-entry-is-client-component](https://attest.ci/docs/rules/client-route-entry-is-client-component) | `app/(auth)/login/page.tsx` | `app/(auth)/login/page.tsx:1` | `app/(auth)/login/page.tsx` is a route entry point marked "use client", so everything it renders ships to the browser. |
| moderate | [client/route-entry-is-client-component](https://attest.ci/docs/rules/client-route-entry-is-client-component) | `app/(auth)/register/page.tsx` | `app/(auth)/register/page.tsx:1` | `app/(auth)/register/page.tsx` is a route entry point marked "use client", so everything it renders ships to the browser. |
| moderate | [client/sequential-server-fetch](https://attest.ci/docs/rules/client-sequential-server-fetch) | `app/(chat)/api/models/route.ts` | `app/(chat)/api/models/route.ts:10` | `getCapabilities()…` and `getAllGatewayModels()…` are awaited in sequence but neither uses the other's result, so the page waits for two round trips instead of one. |
| moderate | [privacy/async-work-outlives-request](https://attest.ci/docs/rules/privacy-async-work-outlives-request) | `app/(chat)/api/chat/route.ts` | `app/(chat)/api/chat/route.ts:238` | `setTimeout` schedules work that outlives this route handler. On a serverless runtime the execution context is frozen once the response is sent and the callback may never run. |
| moderate | [privacy/async-work-outlives-request](https://attest.ci/docs/rules/privacy-async-work-outlives-request) | `app/(chat)/api/chat/route.ts` | `app/(chat)/api/chat/route.ts:342` | `updateChatTitleById(…)` returns a promise that this route handler does not await, so the response can be sent before the work completes. |
| serious | [privacy/server-env-in-client-graph](https://attest.ci/docs/rules/privacy-server-env-in-client-graph) | `lib/ai/models.ts` | `lib/ai/models.ts:109` | `process.env.IS_DEMO` is read in a module that ships to the browser, where it evaluates to undefined. This module reaches the browser through components/chat/multimodal-input.tsx → lib/ai/models.ts. |
| serious | [privacy/server-env-in-client-graph](https://attest.ci/docs/rules/privacy-server-env-in-client-graph) | `lib/constants.ts` | `lib/constants.ts:8` | `process.env.CI_PLAYWRIGHT` is read in a module that ships to the browser, where it evaluates to undefined. This module reaches the browser through components/chat/preview.tsx → lib/constants.ts. |
| serious | [privacy/server-env-in-client-graph](https://attest.ci/docs/rules/privacy-server-env-in-client-graph) | `lib/constants.ts` | `lib/constants.ts:7` | `process.env.PLAYWRIGHT` is read in a module that ships to the browser, where it evaluates to undefined. This module reaches the browser through components/chat/preview.tsx → lib/constants.ts. |
| serious | [privacy/server-env-in-client-graph](https://attest.ci/docs/rules/privacy-server-env-in-client-graph) | `lib/constants.ts` | `lib/constants.ts:6` | `process.env.PLAYWRIGHT_TEST_BASE_URL` is read in a module that ships to the browser, where it evaluates to undefined. This module reaches the browser through components/chat/preview.tsx → lib/constants.ts. |

---

_Automated tooling can evaluate roughly a quarter to a third of WCAG 2.1 success criteria. The rest — meaningful alt text, logical reading order, usable focus management, comprehensible error recovery — requires human judgement. Attest does not attempt them and does not report on them._

_Attest reports the results of automated checks. Automated testing detects only a subset of accessibility barriers. A clean Attest run is not a conformance claim, a legal opinion, or a substitute for testing with assistive technology and with disabled users. This is not legal advice._

_Runtime accessibility detection is performed by axe-core, developed and maintained by Deque Systems, used under the Mozilla Public License 2.0. Attest wraps axe-core; it does not fork or modify it._
