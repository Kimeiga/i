import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { listScanSlugs, readScanPage } from '@/lib/content'

export async function generateStaticParams() {
  return (await listScanSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await readScanPage(slug)
  return { title: page?.title ?? 'Public scan' }
}

export default async function ScanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await readScanPage(slug)
  if (!page) notFound()

  return (
    <article className="prose-attest max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <Link href="/scans" className="text-[var(--color-accent)] underline">
          Public scans
        </Link>
      </nav>
      <div dangerouslySetInnerHTML={{ __html: page.html }} />
    </article>
  )
}
