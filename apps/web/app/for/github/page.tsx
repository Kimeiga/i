import type { Metadata } from 'next'
import { RenderedPage } from '@/components/page-sections'
import { PAGES } from '@/lib/pages'

/** Written for GitHub Marketplace traffic: solution-aware, evaluating a CI check. */
const spec = PAGES.github!

export const metadata: Metadata = {
  title: 'Attest for GitHub Actions',
  description: spec.hero.subhead.replace(/[`*]/g, ''),
}

export default function ForGithub() {
  return <RenderedPage spec={spec} />
}
