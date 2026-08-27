import Link from 'next/link'
import { AUTOMATED_COVERAGE_NOTE, CANONICAL_CLAIM } from '@attestci/core'
import type { Cta, Hero, PageSpec, Section } from '@/lib/page-spec'
import { renderInline } from '@/lib/inline'
import { CopyCommand } from './copy-command'

/**
 * Renderers for the section kinds in lib/page-spec.ts.
 *
 * Deliberately few, and deliberately plain. Every section type that exists is a
 * type some page needed; there is no generic "rich content" escape hatch,
 * because that is how a structured page system becomes a CMS and then becomes
 * forty bespoke layouts that cannot be compared with each other.
 */

export function RenderedPage({ spec }: { spec: PageSpec }) {
  return (
    <div className="space-y-16">
      <HeroBlock hero={spec.hero} primary={spec.primaryCta} secondary={spec.secondaryCta} spec={spec} />
      {spec.sections.map((section) => (
        <SectionBlock key={section.id} section={section} spec={spec} />
      ))}
    </div>
  )
}

function HeroBlock({
  hero,
  primary,
  secondary,
  spec,
}: {
  hero: Hero
  primary: Cta
  secondary?: Cta
  spec: PageSpec
}) {
  return (
    <section className="space-y-6">
      <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {hero.eyebrow}
      </p>

      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">{hero.headline}</h1>

      <p className="max-w-2xl text-lg text-[var(--color-muted)]">{renderInline(hero.subhead)}</p>

      {hero.proofLine ? (
        <p className="max-w-2xl border-l-2 border-[var(--color-accent)] pl-4">
          {renderInline(hero.proofLine.text)}
          {hero.proofLine.href ? (
            <>
              {' '}
              <Link href={hero.proofLine.href} className="text-[var(--color-accent)] underline">
                See the report
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <CtaPair primary={primary} secondary={secondary} spec={spec} />

      <p className="text-sm text-[var(--color-muted)]">{hero.trustLine}</p>

      {/*
        The coverage limit is a fixed structural element sourced from the shared
        constant, not page content. It is above the fold, in body text, at body
        size, on every variant, and no page author can shorten it or move it
        down — which is the only way a statement like this survives contact with
        someone optimising a conversion rate.
      */}
      <div className="max-w-2xl rounded border border-[var(--color-line)] p-4">
        <p>{AUTOMATED_COVERAGE_NOTE}</p>
        <p className="mt-2 font-medium">{CANONICAL_CLAIM}</p>
        <p className="mt-2">
          <Link
            href="/docs/what-attest-cannot-detect"
            className="text-[var(--color-accent)] underline"
          >
            What Attest cannot detect →
          </Link>
        </p>
      </div>
    </section>
  )
}

function CtaPair({
  primary,
  secondary,
  spec,
}: {
  primary: Cta
  secondary?: Cta
  spec: PageSpec
}) {
  return (
    <div className="space-y-3">
      {primary.command ? (
        <CopyCommand
          command={primary.command}
          label={primary.label}
          event={primary.event}
          variant={spec.id}
          experiment={spec.experimentId}
        />
      ) : primary.href ? (
        <Link
          href={primary.href}
          className="inline-block rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
        >
          {primary.label}
        </Link>
      ) : null}

      {secondary?.href ? (
        <p>
          <Link href={secondary.href} className="text-[var(--color-accent)] underline">
            {secondary.label}
          </Link>
        </p>
      ) : null}
    </div>
  )
}

function SectionBlock({ section, spec }: { section: Section; spec: PageSpec }) {
  switch (section.kind) {
    case 'prose':
      return (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">{section.heading}</h2>
          {section.body.map((paragraph, index) => (
            <p key={index} className="max-w-2xl">
              {renderInline(paragraph)}
            </p>
          ))}
        </section>
      )

    case 'evidence':
      return (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">{section.heading}</h2>
          {section.intro ? <p className="max-w-2xl">{renderInline(section.intro)}</p> : null}
          <ol className="max-w-2xl space-y-0 rounded border border-[var(--color-line)] p-4 font-mono text-sm">
            {section.chain.map((step, index) => (
              <li key={step.label}>
                <span className="break-all">{step.label}</span>
                {step.note ? (
                  <span className="ml-2 font-sans text-[var(--color-muted)]">— {step.note}</span>
                ) : null}
                {index < section.chain.length - 1 ? (
                  <div aria-hidden="true" className="py-1 text-[var(--color-muted)]">
                    ↓
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
          {section.caption ? (
            <p className="max-w-2xl">{renderInline(section.caption)}</p>
          ) : null}
          {section.source ? (
            <p>
              <Link href={section.source.href} className="text-[var(--color-accent)] underline">
                {section.source.label} →
              </Link>
            </p>
          ) : null}
        </section>
      )

    case 'code':
      return (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">{section.heading}</h2>
          {section.intro ? <p className="max-w-2xl">{renderInline(section.intro)}</p> : null}
          <pre className="overflow-x-auto rounded border border-[var(--color-line)] p-4 font-mono text-sm">
            <code>{section.code}</code>
          </pre>
          {section.caption ? (
            <p className="max-w-2xl text-[var(--color-muted)]">{renderInline(section.caption)}</p>
          ) : null}
        </section>
      )

    case 'steps':
      return (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">{section.heading}</h2>
          {section.intro ? <p className="max-w-2xl">{renderInline(section.intro)}</p> : null}
          <ol className="max-w-2xl space-y-4">
            {section.steps.map((step) => (
              <li key={step.title}>
                <h3 className="font-medium">{step.title}</h3>
                <p className="mt-1">{renderInline(step.body)}</p>
              </li>
            ))}
          </ol>
        </section>
      )

    case 'table':
      return (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">{section.heading}</h2>
          {section.intro ? <p className="max-w-2xl">{renderInline(section.intro)}</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{section.heading}</caption>
              <thead>
                <tr>
                  {section.columns.map((column, index) => (
                    <th
                      key={index}
                      scope="col"
                      className="border border-[var(--color-line)] px-3 py-2 text-left font-medium"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border border-[var(--color-line)] px-3 py-2">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {section.note ? <p className="max-w-2xl">{renderInline(section.note)}</p> : null}
        </section>
      )

    case 'disclosure':
      return (
        <section
          className={`max-w-2xl space-y-4 rounded border p-5 ${
            section.tone === 'admission'
              ? 'border-[var(--color-accent)]'
              : 'border-[var(--color-line)]'
          }`}
        >
          <h2 className="text-2xl font-semibold">{section.heading}</h2>
          {section.body.map((paragraph, index) => (
            <p key={index}>{renderInline(paragraph)}</p>
          ))}
        </section>
      )

    case 'faq':
      return (
        <section className="space-y-5">
          <h2 className="text-2xl font-semibold">{section.heading}</h2>
          {section.items.map((item) => (
            <div key={item.q} className="max-w-2xl space-y-2">
              <h3 className="font-medium">{item.q}</h3>
              {item.a.map((paragraph, index) => (
                <p key={index}>{renderInline(paragraph)}</p>
              ))}
            </div>
          ))}
        </section>
      )

    case 'cta':
      return (
        <section className="space-y-4 border-t border-[var(--color-line)] pt-10">
          <h2 className="text-2xl font-semibold">{section.heading}</h2>
          {section.body ? <p className="max-w-2xl">{renderInline(section.body)}</p> : null}
          <CtaPair primary={section.primary} secondary={section.secondary} spec={spec} />
        </section>
      )
  }
}
