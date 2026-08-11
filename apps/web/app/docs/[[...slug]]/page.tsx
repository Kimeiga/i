import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { listDocSlugs, readDocPage } from '@/lib/content'

/**
 * Documentation is rendered from the markdown files in `docs/` at build time,
 * so a docs page and the file a contributor edits are the same bytes. The rule
 * pages under `docs/rules/` are themselves generated from the rule definitions
 * and CI fails when they are stale, which means the published rule reference
 * cannot disagree with the code that implements it.
 */

export async function generateStaticParams() {
  const slugs = await listDocSlugs()
  return slugs.map((slug) => ({ slug: slug.length === 0 ? undefined : slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await readDocPage(slug ?? [])
  return { title: page?.title ?? 'Documentation' }
}

export default async function DocPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const page = await readDocPage(slug ?? [])
  if (!page) notFound()

  return (
    <article className="prose-attest max-w-3xl">
      {page.slug.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <Link href="/docs" className="text-[var(--color-accent)] underline">
            Documentation
          </Link>
        </nav>
      ) : null}
      <div dangerouslySetInnerHTML={{ __html: page.html }} />
    </article>
  )
}
