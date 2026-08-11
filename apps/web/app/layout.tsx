import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ATTRIBUTION,
  CANONICAL_CLAIM,
  DISCLAIMER,
  PRODUCT_NAME,
  PRODUCT_URL,
} from '@attestci/core'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(PRODUCT_URL),
  title: {
    default: `${PRODUCT_NAME} — know what your pull request just broke`,
    template: `%s · ${PRODUCT_NAME}`,
  },
  description: CANONICAL_CLAIM,
}

const NAV = [
  { href: '/docs/getting-started', label: 'Docs' },
  { href: '/docs/rules', label: 'Rules' },
  { href: '/docs/what-attest-cannot-detect', label: 'Limits' },
  { href: '/scans', label: 'Public scans' },
  { href: '/pricing', label: 'Pricing' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {/* The first thing in the tab order on every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-blue-700 focus:shadow"
        >
          Skip to content
        </a>

        <header className="border-b border-[var(--color-line)]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
            <Link href="/" className="text-lg font-semibold">
              {PRODUCT_NAME}
            </Link>
            <nav aria-label="Main">
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-5xl px-4 py-10">
          {children}
        </main>

        <footer className="mt-16 border-t border-[var(--color-line)]">
          <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 text-sm text-[var(--color-muted)]">
            {/* The disclaimer is in the footer of every page, not one of them. */}
            <p>{DISCLAIMER}</p>
            <p>{ATTRIBUTION}</p>
            <p className="flex flex-wrap gap-x-4">
              <Link href="/docs/what-attest-cannot-detect" className="underline">
                What {PRODUCT_NAME} cannot detect
              </Link>
              <Link href="/docs/regulatory-context" className="underline">
                Regulatory context
              </Link>
              <a href="https://github.com/attest-ci/attest" className="underline">
                Source
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
