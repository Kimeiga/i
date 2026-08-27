import Link from 'next/link'
import type { Metadata } from 'next'
import { listScanSlugs, readScanPage } from '@/lib/content'

export const metadata: Metadata = { title: 'Public scans' }

/**
 * Every scan published here was run against a pinned commit of an open source
 * project, with the raw content-hashed report committed alongside it, and every
 * page carries a section on what the scan got wrong.
 */
export default async function ScansIndex() {
  const slugs = await listScanSlugs()
  const pages = await Promise.all(slugs.map((slug) => readScanPage(slug)))

  return (
    <div className="prose-attest max-w-3xl">
      <h1>Public scans</h1>
      <p>
        We scan well-known open source React and Next.js projects, publish the full report, and
        contribute the fixes upstream. Each page gives the exact commit, so anyone can reproduce it.
      </p>
      <p>
        Each page also has a <strong>&ldquo;what we got wrong&rdquo;</strong> section. The first
        three scans found two false positives in our own rules — one of which reported 106 phantom
        findings in a codebase with a design system — and both are written up with before and after
        counts. A tool whose false positives you only discover yourself is a tool you should not
        install.
      </p>
      <p>
        We never publish a scan to shame anyone, never contact a company implying legal exposure,
        and never scan a production site for this. Open source repositories only.
      </p>

      <ul>
        {pages.filter(Boolean).map((page) => (
          <li key={page!.slug[0]}>
            <Link href={`/scans/${page!.slug[0]}`}>{page!.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
