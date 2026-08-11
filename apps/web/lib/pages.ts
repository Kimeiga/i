import homeJson from '@/content/pages/home.json'
import githubJson from '@/content/pages/github.json'
import eaaJson from '@/content/pages/eaa.json'
import { assertPageSpec, type PageSpec } from './page-spec'

/**
 * Every landing page in one registry, validated at module load so a malformed
 * spec fails the build rather than rendering a page with no claim ids on it.
 *
 * Pages are keyed by the traffic they are written for, not by topic. A visitor
 * who searched "EAA accessibility testing" and one browsing the GitHub
 * Marketplace are at different levels of awareness and should not be shown the
 * same hero — message match is the cheapest conversion work there is and the
 * easiest to skip.
 */
export const PAGES: Record<string, PageSpec> = {
  home: assertPageSpec(homeJson, 'content/pages/home.json'),
  github: assertPageSpec(githubJson, 'content/pages/github.json'),
  eaa: assertPageSpec(eaaJson, 'content/pages/eaa.json'),
}
