import type { Metadata } from 'next'
import { RenderedPage } from '@/components/page-sections'
import { PAGES } from '@/lib/pages'

const spec = PAGES.home!

export const metadata: Metadata = {
  title: `${spec.hero.headline} · Attest`,
  description: spec.hero.subhead.replace(/[`*]/g, ''),
}

export default function Home() {
  return <RenderedPage spec={spec} />
}
