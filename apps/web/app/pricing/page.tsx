import Link from 'next/link'
import type { Metadata } from 'next'
import { PRODUCT_NAME } from '@attestci/core'

export const metadata: Metadata = { title: 'Pricing' }

interface Tier {
  name: string
  price: string
  unit?: string
  note: string
  features: string[]
  status: string
  cta?: { label: string; href: string }
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    note: 'MIT licensed. Not a trial.',
    features: [
      'CLI with all 30 rules',
      'GitHub Action and PR comment',
      'JSON, SARIF and markdown output',
      'README badge',
      'Unlimited local use',
    ],
    status: 'Available now',
    cta: { label: 'Getting started', href: '/docs/getting-started' },
  },
  {
    name: 'Solo',
    price: '$49',
    unit: 'per repository / month',
    note: 'For one repository you want a history for.',
    features: [
      'Everything in Free',
      'Historical trend and regression tracking',
      'Hash-chained evidence store',
      'One repository',
    ],
    status: 'Not yet available',
  },
  {
    name: 'Team',
    price: '$299',
    unit: 'per month',
    note: 'For a team that has been asked for evidence.',
    features: [
      'Everything in Solo',
      'Up to 10 repositories',
      'Organisation-wide policy',
      'Signed evidence export (JSON + PDF)',
      'Accessibility statement drafting',
    ],
    status: 'Not yet available',
  },
]

export default function Pricing() {
  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold">Pricing</h1>
        <p className="max-w-2xl text-[var(--color-muted)]">
          The free tier is not a trial. It is the whole tool, MIT licensed, and it stays that way.
          You pay for memory, not for detection.
        </p>
        <p className="max-w-2xl">
          <strong>The paid tiers are not yet available.</strong> The hosted service is written and
          tested but nothing is deployed, so nothing is for sale. The prices below are the intended
          ones, published early so nobody is surprised later — not an offer you can accept today.
        </p>
      </section>

      <section>
        <h2 className="sr-only">Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div key={tier.name} className="rounded border border-[var(--color-line)] p-5">
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="mt-2">
                <span className="text-3xl font-semibold">{tier.price}</span>{' '}
                {tier.unit ? (
                  <span className="text-sm text-[var(--color-muted)]">{tier.unit}</span>
                ) : null}
              </p>
              <p className="mt-1 text-sm font-medium">{tier.status}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{tier.note}</p>
              <ul className="mt-4 space-y-1 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {tier.cta ? (
                <p className="mt-5">
                  <Link href={tier.cta.href} className="text-[var(--color-accent)] underline">
                    {tier.cta.label}
                  </Link>
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-2xl space-y-4">
        <h2 className="text-2xl font-semibold">Things we do not sell</h2>
        <p>
          No enterprise tier, no sales calls, no annual contracts, no SOC 2, no SAML, no custom
          contracts, no negotiated data processing agreements, no security questionnaires, no phone
          support, no SLA.
        </p>
        <p>
          Every one of those is a synchronous obligation that a one-person business cannot carry,
          and the pricing assumes their absence. If your procurement requires them,{' '}
          <strong>we are not a good fit and we will tell you so</strong> rather than take your money
          and fail you later. The CLI and the Action are MIT licensed, so your team can use those
          with no relationship with us at all.
        </p>
      </section>

      <section className="max-w-2xl space-y-4">
        <h2 className="text-2xl font-semibold">Questions people ask before paying</h2>

        <div className="space-y-2">
          <h3 className="font-medium">Will this make us compliant?</h3>
          <p>
            No. Conformance is a determination about a whole service, normally involving a human
            audit and testing with disabled users. {PRODUCT_NAME} handles the mechanical part and
            dates it.{' '}
            <Link href="/docs/what-attest-cannot-detect" className="text-[var(--color-accent)] underline">
              What it cannot detect →
            </Link>
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Is my code sent anywhere?</h3>
          <p>
            The CLI runs entirely locally and sends nothing. The hosted service receives the report
            — findings, file paths, line numbers, and short code excerpts — not your repository.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">What happens if I stop paying?</h3>
          <p>
            The account drops to free and nothing is deleted. Losing your evidence trail over an
            expired card is not a retention strategy.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Refunds?</h3>
          <p>Full refund within 30 days, no explanation needed. Cancel from settings, one click.</p>
        </div>
      </section>
    </div>
  )
}
