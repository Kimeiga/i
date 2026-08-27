# Attest scan report

- Tool: Attest 0.1.0
- Scanned: 2026-08-11T18:25:58.492Z
- Repository: vercel/commerce
- Commit: `3761e52e60df9c6a316e067dbfd7032e494d3634`
- Report hash: `sha256:b1b8c3b98a1b362243c5bedb7f82ad84beccc7c82c162d93c2d6f56d753ef705`

## What ran

| Layer | Ran | Rules | Examined |
| --- | --- | --- | --- |
| Static accessibility (source analysis) | yes | 6 | 66 source files |
| Runtime accessibility (axe-core in a browser) | no — no URLs were given, so no page was rendered. Pass --url to check a running application. | 0 | 0 n/a |
| Privacy and placement (source analysis) | yes | 7 | 66 source files |
| Client impact | yes | 2 | 66 source files |

## Findings

| Severity | Rule | Surface | Where | What |
| --- | --- | --- | --- | --- |
| serious | [a11y/click-without-keyboard](https://attest.ci/docs/rules/a11y-click-without-keyboard) | `components/layout/search/filter/dropdown.tsx` | `components/layout/search/filter/dropdown.tsx:41` | <div> handles onClick but no key events, so it cannot be activated from a keyboard. |
| serious | [a11y/click-without-keyboard](https://attest.ci/docs/rules/a11y-click-without-keyboard) | `components/layout/search/filter/dropdown.tsx` | `components/layout/search/filter/dropdown.tsx:51` | <div> handles onClick but no key events, so it cannot be activated from a keyboard. |
| serious | [a11y/label-association](https://attest.ci/docs/rules/a11y-label-association) | `components/layout/navbar/search.tsx` | `components/layout/navbar/search.tsx:15` | This <input> has no id and no accessible name, so no <label> can be associated with it. The placeholder "Search for products..." is not a label. |
| serious | [a11y/label-association](https://attest.ci/docs/rules/a11y-label-association) | `components/layout/navbar/search.tsx` | `components/layout/navbar/search.tsx:34` | This <input> has no id and no accessible name, so no <label> can be associated with it. The placeholder "Search for products..." is not a label. |
| serious | [privacy/server-env-in-client-graph](https://attest.ci/docs/rules/privacy-server-env-in-client-graph) | `lib/utils.ts` | `lib/utils.ts:44` | `process.env.SHOPIFY_STORE_DOMAIN` is read in a module that ships to the browser, where it evaluates to undefined. This module reaches the browser through components/cart/modal.tsx → lib/utils.ts. |
| serious | [privacy/server-env-in-client-graph](https://attest.ci/docs/rules/privacy-server-env-in-client-graph) | `lib/utils.ts` | `lib/utils.ts:45` | `process.env.SHOPIFY_STORE_DOMAIN` is read in a module that ships to the browser, where it evaluates to undefined. This module reaches the browser through components/cart/modal.tsx → lib/utils.ts. |
| serious | [privacy/server-env-in-client-graph](https://attest.ci/docs/rules/privacy-server-env-in-client-graph) | `lib/utils.ts` | `lib/utils.ts:3` | `process.env.VERCEL_PROJECT_PRODUCTION_URL` is read in a module that ships to the browser, where it evaluates to undefined. This module reaches the browser through components/cart/modal.tsx → lib/utils.ts. |
| serious | [privacy/server-env-in-client-graph](https://attest.ci/docs/rules/privacy-server-env-in-client-graph) | `lib/utils.ts` | `lib/utils.ts:4` | `process.env.VERCEL_PROJECT_PRODUCTION_URL` is read in a module that ships to the browser, where it evaluates to undefined. This module reaches the browser through components/cart/modal.tsx → lib/utils.ts. |

---

_Automated tooling can evaluate roughly a quarter to a third of WCAG 2.1 success criteria. The rest — meaningful alt text, logical reading order, usable focus management, comprehensible error recovery — requires human judgement. Attest does not attempt them and does not report on them._

_Attest reports the results of automated checks. Automated testing detects only a subset of accessibility barriers. A clean Attest run is not a conformance claim, a legal opinion, or a substitute for testing with assistive technology and with disabled users. This is not legal advice._

_Runtime accessibility detection is performed by axe-core, developed and maintained by Deque Systems, used under the Mozilla Public License 2.0. Attest wraps axe-core; it does not fork or modify it._
