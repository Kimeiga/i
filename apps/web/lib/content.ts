import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { marked } from 'marked'

/**
 * Documentation and scan pages are read from the markdown files in the
 * repository at build time.
 *
 * There is no CMS and no duplicated copy. A docs page and the file a
 * contributor edits in a pull request are the same bytes, so the published site
 * cannot quietly drift from what is in git — which matters more than usual
 * here, because the rule pages are themselves generated from the rule
 * definitions and CI fails when they are stale.
 */

const repoRoot = join(process.cwd(), '..', '..')
const docsRoot = join(repoRoot, 'docs')
const scansRoot = join(repoRoot, 'gtm', 'public-scans')

export interface Page {
  slug: string[]
  title: string
  html: string
}

marked.setOptions({ gfm: true })

export async function readDocPage(slug: string[]): Promise<Page | undefined> {
  const relative = slug.length === 0 ? 'index.md' : `${slug.join('/')}.md`
  // Refuse anything that tries to climb out of the docs directory.
  if (relative.includes('..')) return undefined

  let source: string
  try {
    source = await readFile(join(docsRoot, relative), 'utf8')
  } catch {
    return undefined
  }

  return {
    slug,
    title: firstHeading(source) ?? slug.join(' / '),
    html: await render(source, docLinkRewriter),
  }
}

export async function listDocSlugs(): Promise<string[][]> {
  const out: string[][] = [[]]
  await walk(docsRoot, [], out)
  return out
}

async function walk(dir: string, prefix: string[], out: string[][]): Promise<void> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await walk(join(dir, entry.name), [...prefix, entry.name], out)
      continue
    }
    if (!entry.name.endsWith('.md')) continue
    // `notes/` holds prose spliced into generated rule pages; it is not itself
    // a page and publishing it would duplicate every rule page's content.
    if (prefix.includes('notes')) continue
    const name = entry.name.replace(/\.md$/, '')
    if (prefix.length === 0 && name === 'index') continue
    out.push([...prefix, name])
  }
}

export async function readScanPage(slug: string): Promise<Page | undefined> {
  if (slug.includes('..') || slug.includes('/')) return undefined
  let source: string
  try {
    source = await readFile(join(scansRoot, `${slug}.md`), 'utf8')
  } catch {
    return undefined
  }
  return {
    slug: [slug],
    title: firstHeading(source) ?? slug,
    html: await render(source, scanLinkRewriter),
  }
}

export async function listScanSlugs(): Promise<string[]> {
  try {
    const entries = await readdir(scansRoot, { withFileTypes: true })
    return entries
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name.replace(/\.md$/, ''))
      // README, TEMPLATE and ISSUE-TEMPLATE are process documents, not scans.
      .filter((name) => /^\d{4}-\d{2}-/.test(name))
      .sort()
      .reverse()
  } catch {
    return []
  }
}

function firstHeading(source: string): string | undefined {
  return source.match(/^#\s+(.+)$/m)?.[1]?.replace(/`/g, '')
}

/**
 * Rewrites the relative links that work inside the repository into the paths
 * they have on the site. Anything not rewritten stays a working GitHub link,
 * which is the right failure mode.
 */
type Rewriter = (href: string) => string

const docLinkRewriter: Rewriter = (href) => {
  if (/^(https?:|mailto:|#)/.test(href)) return href
  if (href.startsWith('../')) {
    // docs/rules/foo.md -> ../regulatory-context.md -> /docs/regulatory-context
    return `/docs/${href.replace(/^(\.\.\/)+/, '').replace(/\.md$/, '')}`
  }
  return `/docs/${href.replace(/^\.\//, '').replace(/\.md$/, '')}`
}

const scanLinkRewriter: Rewriter = (href) => {
  if (/^(https?:|mailto:|#)/.test(href)) return href
  if (href.startsWith('reports/')) {
    return `https://github.com/attest-ci/attest/blob/main/gtm/public-scans/${href}`
  }
  if (href.includes('docs/')) {
    return `/docs/${href.replace(/^(\.\.\/)+/, '').replace(/^docs\//, '').replace(/\.md$/, '')}`
  }
  return href.replace(/\.md$/, '')
}

async function render(source: string, rewrite: Rewriter): Promise<string> {
  const renderer = new marked.Renderer()
  const baseLink = renderer.link.bind(renderer)
  renderer.link = (token) => baseLink({ ...token, href: rewrite(token.href) })
  return marked.parse(source, { renderer, async: true })
}
