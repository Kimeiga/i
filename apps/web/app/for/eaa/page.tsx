import type { Metadata } from 'next'
import { RenderedPage } from '@/components/page-sections'
import { PAGES } from '@/lib/pages'

/**
 * Written for European Accessibility Act search traffic: problem-aware, and the
 * most legally sensitive audience the product has. The scope table is the first
 * section on this page rather than the last, because a visitor arriving from a
 * compliance search is the one most likely to over-read what a scanner can do.
 */
const spec = PAGES.eaa!

export const metadata: Metadata = {
  title: 'Accessibility regression testing for React and Next.js',
  description: spec.hero.subhead.replace(/[`*]/g, ''),
}

export default function ForEaa() {
  return <RenderedPage spec={spec} />
}
