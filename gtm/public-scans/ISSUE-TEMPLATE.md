# Upstream issue and pull request templates

Rules, before the templates:

- **A pull request beats an issue.** If you can write the patch, write the patch.
- **One finding per issue.** A list of twelve things reads as an audit somebody
  didn't ask for.
- **No product pitch.** One line naming the tool, at the end, only if it helps
  them reproduce. Nothing else.
- **No legal framing.** Never mention the EAA, WCAG conformance obligations,
  lawsuits, or risk. You are contributing to a project, not warning them.
- **Read `CONTRIBUTING.md` first**, and follow their template if they have one.

---

## Pull request

> **Title:** Add accessible names to icon-only buttons in the chat toolbar
>
> The close, dismiss and version-navigation buttons contain only an icon and no
> text, so they expose no accessible name — a screen reader announces each as
> "button" with no indication of what it does.
>
> This adds an `aria-label` to each and marks the icons `aria-hidden` so they are
> not announced twice.
>
> - `components/chat/artifact-close-button.tsx` — "Close artifact"
> - `components/chat/preview-attachment.tsx` — "Remove attachment"
> - `components/chat/suggestion.tsx` — "Dismiss suggestion"
> - `components/chat/version-footer.tsx` — "Previous version"
>
> Happy to adjust the wording — the labels should say what the action does, and
> you know the intended behaviour better than I do.

Short. Specific. Offers to be corrected. No mention of any tool, because the patch
speaks for itself.

---

## Issue, when a patch is not appropriate

Use this when the fix is a design decision rather than a change you can make for
them.

> **Title:** Keyboard interaction in the multiselect primitive
>
> `packages/ui/primitives/multiselect.tsx:403` uses a `<div>` with an `onClick`
> and no key handling, so the option cannot be selected from a keyboard. Because
> this is a shared primitive, everything built on it inherits the behaviour.
>
> The fix depends on what you want the widget to be. If it is a listbox, the ARIA
> Authoring Practices [listbox
> pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) covers the arrow-key
> and selection behaviour. If a simpler `role="button"` plus `tabIndex={0}` plus
> `onKeyDown` on each option is enough, that is a much smaller change.
>
> I did not open a pull request because picking between those is your call. Happy
> to write either one if it would help.
>
> Found with [Attest](https://attest.ci), a CI check I am building; the rule is
> [`a11y/click-without-keyboard`](https://attest.ci/docs/rules/a11y-click-without-keyboard).

The tool mention is one line, at the end, and only earns its place because it
tells the maintainer how to check the rest of the codebase themselves.

---

## If a maintainer pushes back

Take it. Publicly.

> Fair enough — thanks for explaining. I have updated the public scan page to
> reflect that this is intentional.

Then actually update the page. If the pushback reveals a false positive, fix the
rule, add a fixture, and say so on the page with the before and after numbers.

Being visibly correctable is the only reputation strategy available to a tool in
this category, and it is worth more than any individual finding.

---

## Never send

- Anything to a company's sales, legal or support address about their site.
- Anything implying they are at legal risk.
- Anything about a **production site** rather than an open-source repository.
- Anything to a project that says it does not want unsolicited issues.
- A follow-up. One message. If it is ignored, it is ignored.
