# What Attest cannot detect

Every accessibility tool has this page. Most of them bury it. This one is linked
from the README, from the CLI's help output, from every rule page, and from the
bottom of every report, because the honest boundary of a tool is more useful than
its feature list — and because a vendor who will not tell you their limits is
telling you something else.

Attest owns the automatable subset of accessibility conformance, proves it does
not regress, and produces the evidence trail. It does not make you compliant, and
no tool can.

---

## The short version

Automated tooling can evaluate roughly **a quarter to a third** of WCAG 2.1
success criteria. The rest requires a person.

We state that as a range rather than a number because published estimates vary
with methodology and with which criteria are counted, and we have not run our own
study. Anyone quoting you a precise percentage for their own coverage either has
a study they will show you, or is guessing.

A clean Attest run means the checks that ran found nothing. It does not mean the
application is usable by disabled people, and it is not a conformance claim.

---

## What no automated tool can judge

These are not gaps we plan to close. They are questions with no machine-checkable
answer.

### Whether alt text is *correct*

A tool can tell you an image has no `alt` attribute. It cannot tell you whether
`alt="chart"` describes the chart. `alt="Quarterly revenue, rising from 1.2M to
1.9M"` and `alt="image"` are equally valid to a validator and completely different
to a user. (WCAG 1.1.1)

### Whether the reading order makes sense

We can detect a positive `tabindex`. We cannot tell you whether the order your
markup produces is the order the content means. That requires understanding the
content. (WCAG 1.3.2, 2.4.3)

### Whether a heading structure describes the page

We can report that headings skip a level. Whether `<h2>Details</h2>` is the right
heading for that section is an editorial question. (WCAG 2.4.6)

### Whether an error message helps

We can detect that a field marked invalid points at no message. We cannot tell
you whether "Invalid input" tells the user how to fix it. It does not. (WCAG
3.3.1, 3.3.3)

### Whether focus goes somewhere sensible

We can find focusable elements hidden from assistive technology. Whether focus
lands in the right place when a dialog opens, and returns to the right place when
it closes, needs a person with a keyboard. (WCAG 2.4.3)

### Whether a custom widget behaves like the thing it claims to be

`role="combobox"` promises arrow-key behaviour, an expanded state, and an active
descendant. A tool can check the attributes exist. Only using it tells you whether
it works. (WCAG 4.1.2)

### Whether the language is understandable

Cognitive accessibility is largely outside what any validator touches, and it is
what most often decides whether someone can actually complete a task.

### Whether it works with an actual screen reader

NVDA, JAWS and VoiceOver disagree with each other and with the specification. The
only way to know how your page is announced is to listen to it.

---

## What Attest specifically does not do

Beyond the general limits above, these are our own gaps.

### PDFs, documents, video and audio

EN 301 549 covers documents, captions, audio description and media players. We
check none of it. If your service delivers PDFs or video, that is in scope for the
regulation and out of scope for this tool.

### Native mobile applications

The Carrefour ruling in June 2026 covered a mobile app explicitly. We check React
and Next.js web applications only.

### Email, third-party embeds, and content in iframes

We can tell you an `<iframe>` has no title. We do not scan what is inside it. A
checkout widget, a support chat, a cookie banner, and an embedded video player are
all frequently the least accessible things on a page and all frequently supplied by
somebody else.

### Anything on a page you do not point us at

The runtime accessibility checks only see URLs you list. Pages behind a login you
did not authenticate, states you did not navigate to, and error states you did not
trigger are not scanned. A report over three URLs is a report over three URLs.

### Anything rendered after we looked

We evaluate the DOM after `load`. Content that appears on interaction — a dialog,
a menu, a validation message, the second step of a form — is not evaluated unless
your test drives the page into that state first.

### Frameworks other than React and Next.js

The static rules read React and Next.js source. Vue, Svelte, Angular, Rails and
plain HTML applications get nothing from that layer. The runtime accessibility
layer is framework-agnostic, because axe-core runs against a rendered DOM and does
not care what produced it.

### Anything inside `node_modules`

The client import graph stops at your own source. A server-only value laundered
through a published package is invisible to us.

### Dynamic imports and computed access

`import(someVariable)` and `process.env[name]` cannot be resolved statically. Both
are places our privacy rules stop.

---

## Where we are stricter than axe-core

Two places, both deliberate, both worth knowing about:

**Placeholder-only form fields.** axe-core does not report an `<input>` whose only
name comes from its `placeholder`, and it is right not to: the placeholder does
supply an accessible name under the accessible-name computation, so the markup is
valid. We report it anyway, because the placeholder disappears as soon as the field
has a value — exactly when someone checking their work needs it. That is a WCAG
3.3.2 concern rather than a markup error.

**Invalid fields with no associated message.** A field with `aria-invalid` and no
`aria-describedby` is valid ARIA. It is also a field that announces "invalid entry"
and nothing else. See [`a11y/form-error-not-associated`](rules/a11y-form-error-not-associated.md).

Both are judgement calls, both are stated on their rule pages, and both can be
turned off.

---

## What we do not do on principle

**We will never ship an overlay.** Not a widget, not a script tag, not a runtime
"fix". Overlays do not produce conformance, and their presence is treated by
plaintiffs and regulators as evidence that a site is *not* genuinely accessible. In
January 2025 the US Federal Trade Commission ordered accessiBe to pay $1,000,000
over claims that its AI product could make websites conform to WCAG 2.1 AA
([FTC press release](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-order-requires-online-marketer-pay-1-million-deceptive-claims-its-ai-product-could-make-websites)).
That is the precise failure mode this product is built to avoid.

**We will never tell you that you are compliant.** Conformance is a determination
about a whole service, made against a standard, usually with a human audit and
input from disabled users. It is not an output of a CI job.

---

## So what is the point?

Three things, and they are worth being clear about.

**Regression prevention.** The automatable subset is small, but it is the part that
silently gets worse every sprint. Catching it in the pull request that introduces
it costs minutes; finding it in an audit six months later costs a remediation
project.

**The evidence trail.** Every scan is timestamped and content-hashed, and every
suppression is recorded with its reason. When somebody asks what you knew and when
you knew it, that is an answer. This is the part that has nothing to do with
detection coverage, and it is the part you cannot get from running axe by hand.

**The layer nobody else checks.** The privacy and placement rules — session data
entering a shared cache, server values reaching the browser, effects repeated under
retry — have no equivalent in accessibility tooling or in ESLint, and they fail
silently in exactly the environments where you cannot reproduce them.

---

## What to do about the rest

Buy a manual audit from people who do it properly. Deque, TetraLogical, and The
Paciello Group all do; so do a lot of smaller independent practitioners. Test with
disabled users. Learn to use a screen reader well enough to check your own work.

Attest makes that audit cheaper by handling the mechanical findings before anyone
bills you hourly for them. It does not replace it, and a vendor who tells you
otherwise is the reason this page exists.

---

_Attest reports the results of automated checks. Automated testing detects only a
subset of accessibility barriers. A clean Attest run is not a conformance claim, a
legal opinion, or a substitute for testing with assistive technology and with
disabled users. This is not legal advice._
