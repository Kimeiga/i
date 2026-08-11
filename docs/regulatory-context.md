# Regulatory context

**This is not legal advice.** It is a record of what was checked, when, and against
which primary source, so you can verify it yourself rather than take our word for
it. Regulations move. If a date here matters to a decision you are making, follow
the link and read the source.

Last verified: **11 August 2026**. Anything marked `[UNVERIFIED]` is a claim we
have not been able to confirm against a primary source and do not rely on.

---

## The European Accessibility Act

Directive (EU) 2019/882 has applied since **28 June 2025**. Member states
transposed it into national law, so the enforcement body, the procedure and the
penalties differ by country — there is no single EU-wide regulator and no
cross-border penalty cap.

Primary source:
[Directive (EU) 2019/882](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32019L0882)

**Who is in scope.** Businesses selling into the EU, including businesses based
outside it. E-commerce, banking, e-books, transport ticketing, and consumer-facing
digital services are the categories that matter most for web applications.
Micro-enterprises providing services (fewer than 10 people and under €2M turnover)
are exempt from most obligations — check the directive and your national
transposition, because the exemption is narrower than it sounds.

**A service sold in five member states is subject to five national enforcement
regimes**, each with its own procedure and its own maximum penalty.

---

## The technical standard: EN 301 549

The harmonised European standard for ICT accessibility. Clause 9 covers web
content, and its sub-clauses map one-to-one onto WCAG success criteria.

**The current harmonised version is v3.2.1, which incorporates WCAG 2.1 Level AA
in full.** That is why every WCAG reference in this product cites 2.1 rather than
2.2.

**A v4.x is in progress.** A draft V4.1.0 was published for review in November 2025
and a final draft in June 2026; the version expected to be cited in the Official
Journal, v4.1.1, incorporates WCAG 2.2 AA — adding six success criteria to clauses
9, 10 and 11. Reporting suggests an Official Journal reference around October 2026.
Until that reference lands, **v3.2.1 and WCAG 2.1 AA remain the legal yardstick.**

Primary sources:
- [ETSI EN 301 549 deliverables](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/)
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/) and [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

**What this means for you and for us.** Our rules map to WCAG 2.1 today. When
v4.1.1 is cited in the Official Journal we will add the WCAG 2.2 criteria and tag
rules with both, rather than silently re-labelling existing findings. Watch
[`docs/changelog.md`](changelog.md).

---

## Enforcement is real, and it is happening now

Three cases worth knowing about. All three are reported through secondary sources;
where we could not reach a primary court or regulator document, that is noted.

**France — Carrefour, June 2026.** The Tribunal judiciaire de Caen ruled against
Carrefour over the inaccessibility of its grocery website and mobile app, following
action brought by the associations ApiDV and Droit Pluriel. The court ordered both
the site and the app to be made accessible within six months, with a penalty of
€500 per day past the deadline. Carrefour argued it met 71% of the applicable RGAA
criteria; the court held that partial conformance is not conformance. Notable as the
first ruling under a national EAA transposition to order remediation from a
retailer, and the first to cover a mobile app explicitly. _Secondary sources only;
we have not obtained the judgment._

**Norway — HelsaMi, from August 2025.** Norway's equality and anti-discrimination
regulator imposed a coercive daily fine (*tvangsmulkt*) reported at NOK 50,000 —
roughly €4,500 — on the HelsaMi health portal operated by Norsk Helsenett, over
persistent keyboard accessibility failures. Coercive fines accumulate daily until
the problem is fixed, with no ceiling; the accumulated total was reported to exceed
NOK 3.5M by December 2025. Norway is EEA, not EU, and enforces under its own
Equality and Anti-Discrimination Act rather than the EAA. _Secondary sources only._

**Netherlands.** The Authority for Consumers and Markets set a deadline in late 2025
for businesses to report non-conformance, with targeted audits following for those
that did not respond. _Secondary sources only._

---

## Penalties vary enormously by member state

Reported maxima range from roughly **€60,000 in Ireland** to roughly **€900,000 in
Sweden** (SEK 10 million, with market-ban powers). Ireland is reported to be the
only member state attaching criminal sanctions, including imprisonment on
indictment.

_These figures come from secondary compilations, several of them published by
accessibility vendors with an interest in the number being large. Treat them as
indicative. Check your national transposition before relying on any of them._

---

## What we deliberately do not claim

There are figures we have seen quoted widely and cannot verify against a primary
source, so we do not use them in any product surface:

- `[UNVERIFIED]` The proportion of EU e-commerce pages passing automated checks.
- `[UNVERIFIED]` Typical enterprise accessibility platform pricing.
- `[UNVERIFIED]` Churn and retention benchmarks by software category.
- `[UNVERIFIED]` Any minimum-installation threshold for a paid GitHub Marketplace
  listing. GitHub's published requirements for paid plans cover organisation
  ownership, two-factor authentication and a verified domain; we found no
  install-count threshold in the documentation and could not reach it directly to
  confirm.

If you find a primary source for any of these, please open an issue — we would
rather cite it than leave the gap.

---

## The United States is a different regime

The ADA has no WCAG-referencing technical standard for private businesses, but
Title II regulations for state and local government adopted WCAG 2.1 AA with
compliance dates in 2026 and 2027. Private-sector exposure comes through litigation
rather than through a standard.

Separately, and importantly for this category: in January 2025 the Federal Trade
Commission ordered accessiBe to pay $1,000,000 over deceptive claims that its
AI-powered overlay could make any website conform to WCAG 2.1 AA. The order was
finalised in April 2025. That case is why this product's claims are constrained in
code — see [positioning](../gtm/positioning.md) and the forbidden-claims check in
CI.

Primary source:
[FTC press release, January 2025](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-order-requires-online-marketer-pay-1-million-deceptive-claims-its-ai-product-could-make-websites)

---

## What to do with this

Accessibility conformance is a determination about a whole service, made against a
standard, normally with a human audit and input from disabled users. Attest handles
the mechanical part and dates it. The rest needs people, and if a regulator or a
plaintiff's lawyer is already involved, it needs a lawyer.

_This is not legal advice._
