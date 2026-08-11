import Link from 'next/link'
import { AUTOMATED_COVERAGE_NOTE, PRODUCT_NAME, PRODUCT_SLUG } from '@attestci/core'

const PR_COMMENT = `Accessibility conformance changed
checkout/PaymentForm: 3 new WCAG 2.1 AA violations (label association, focus order)

Privacy boundary changed
customer_profile: session-private → reachable from shared cache

Client impact
+18 KB startup JavaScript, one new sequential server fetch`

const CACHE_EXAMPLE = `const response = await fetch('/api/customer_profile', {
  headers: { Authorization: \`Bearer \${token}\` },
  next: { revalidate: 3600 },        // ← a cache shared by every visitor
})`

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight">
          Know what your pull request just broke.
        </h1>
        <p className="max-w-2xl text-lg text-[var(--color-muted)]">
          {PRODUCT_NAME} is a CI check for React and Next.js that reports what changed about your
          app&rsquo;s accessibility conformance, privacy boundaries and client cost — and keeps a
          timestamped, verifiable record of every scan.
        </p>

        <pre aria-label="Example pull request comment">
          <code>{PR_COMMENT}</code>
        </pre>

        <div className="space-y-2">
          <pre>
            <code>npx @attestci/cli scan .</code>
          </pre>
          <p className="text-sm text-[var(--color-muted)]">
            No account. No signup. No telemetry.
          </p>
        </div>

        {/*
          The coverage limit is above the fold, in body text, at the same size
          as everything else. Honesty is the differentiator against the overlay
          vendors, so burying it would defeat the point of having it.
        */}
        <div className="max-w-2xl rounded border border-[var(--color-line)] p-4">
          <p>
            {AUTOMATED_COVERAGE_NOTE.replace(`${PRODUCT_NAME} does not`, `${PRODUCT_NAME} does not`)}{' '}
            <strong>It does not make you compliant, and no tool can.</strong>
          </p>
          <p className="mt-2">
            <Link href="/docs/what-attest-cannot-detect" className="text-[var(--color-accent)] underline">
              What {PRODUCT_NAME} cannot detect →
            </Link>
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">What it catches that nothing else does</h2>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Session data entering a shared cache</h3>
          <pre>
            <code>{CACHE_EXAMPLE}</code>
          </pre>
          <p className="max-w-2xl">
            The Next.js Data Cache is keyed by URL, not by user. This serves one customer&rsquo;s
            profile to the next visitor. It works perfectly in development, where there is one user.
          </p>
          <p className="max-w-2xl">
            axe cannot see it — it evaluates rendered DOM. ESLint cannot see it — it reads one file
            at a time.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">
            Server values reaching the browser through an import chain
          </h3>
          <pre>
            <code>{`components/cart/modal.tsx  →  lib/utils.ts  →  process.env.VERCEL_PROJECT_PRODUCTION_URL
      'use client'              no directive        undefined in the browser`}</code>
          </pre>
          <p className="max-w-2xl">
            A real finding from a real scan of{' '}
            <Link href="/scans/2026-08-vercel-commerce" className="text-[var(--color-accent)] underline">
              Next.js Commerce
            </Link>
            . <code>lib/utils.ts</code> has no <code>&apos;use client&apos;</code> in it. It is
            browser code because something imported it, and the value it reads is{' '}
            <code>undefined</code> there — silently, with no error.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Accessibility, from axe-core, on every pull request</h3>
          <p className="max-w-2xl">
            We run <a href="https://github.com/dequelabs/axe-core" className="text-[var(--color-accent)] underline">axe-core</a>{' '}
            — Deque&rsquo;s, unmodified, credited — against your real rendered DOM, plus
            source-level rules that catch a narrower set without needing a browser.
          </p>
          <p className="max-w-2xl">
            The difference from running axe yourself is not detection. It is that this runs every
            time, reports what <em>changed</em>, and remembers.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">The evidence trail</h2>
        <p className="max-w-2xl">
          Every scan is timestamped and content-hashed. Two scans of identical code produce an
          identical hash on any machine, so a third party can recompute it.
        </p>
        <p className="max-w-2xl">
          Suppressions stay in the record, with the reason the developer gave. The question that
          gets asked is <em>what did you know and when</em>, and &ldquo;we waived it, here&rsquo;s
          why&rdquo; is an answer. A tool whose output can be silenced invisibly is worthless as
          evidence.
        </p>
        <p>
          <Link href="/docs/evidence-trail" className="text-[var(--color-accent)] underline">
            How the evidence trail works →
          </Link>
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">What it does not do</h2>
        <ul className="max-w-2xl">
          <li>It does not tell you whether your alt text is <em>correct</em>. No tool can.</li>
          <li>It does not test with a screen reader, and you should.</li>
          <li>
            It does not check PDFs, video captions, or native mobile apps — all of which EN 301 549
            covers.
          </li>
          <li>It does not scan pages you do not point it at.</li>
          <li>
            <strong>It will never ship an overlay or a widget.</strong> Overlays do not produce
            conformance, and in January 2025 the US Federal Trade Commission ordered accessiBe to
            pay $1,000,000 over claims that its AI could make sites conform to WCAG.
          </li>
        </ul>
        <p>
          <Link href="/docs/what-attest-cannot-detect" className="text-[var(--color-accent)] underline">
            The full list →
          </Link>
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Get started</h2>
        <pre>
          <code>{`# Source-level checks, no browser needed
npx @attestci/cli scan .

# Add the runtime accessibility checks
npm i -D playwright && npx playwright install chromium
npx @attestci/cli scan . --url http://localhost:3000`}</code>
        </pre>
        <p>
          <Link href="/docs/getting-started" className="text-[var(--color-accent)] underline">
            Getting started →
          </Link>{' '}
          <span aria-hidden="true">·</span>{' '}
          <Link href={`/docs/rules`} className="text-[var(--color-accent)] underline">
            All 30 rules →
          </Link>{' '}
          <span aria-hidden="true">·</span>{' '}
          <Link href="/pricing" className="text-[var(--color-accent)] underline">
            Pricing →
          </Link>
        </p>
        <p className="text-sm text-[var(--color-muted)]">
          The CLI binary is <code>{PRODUCT_SLUG}</code>.
        </p>
      </section>
    </div>
  )
}
