import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { BuildMetrics } from './types.js'

/**
 * Reads Next.js build manifests and turns them into first-load JavaScript
 * figures per route.
 *
 * This deliberately measures on-disk bytes rather than estimating gzip: the
 * number is used for deltas between two builds of the same project, and a
 * consistent, checkable measurement beats a more flattering estimate. The
 * report records which manifest produced it so the figure can be re-derived.
 *
 * Manifest shapes are Next.js internals and change between major versions. We
 * read them defensively and return `{}` rather than guessing when the shape is
 * unfamiliar — a missing metric is honest, a wrong metric is not.
 */
export async function analyzeBuild(buildDir: string): Promise<BuildMetrics> {
  const appManifest = join(buildDir, 'app-build-manifest.json')
  const pagesManifest = join(buildDir, 'build-manifest.json')

  const routes = new Map<string, Set<string>>()
  const sources: string[] = []

  if (existsSync(appManifest)) {
    const parsed = await readJson(appManifest)
    const pages = (parsed as { pages?: Record<string, unknown> } | undefined)?.pages
    if (pages && typeof pages === 'object') {
      for (const [route, chunks] of Object.entries(pages)) {
        if (!Array.isArray(chunks)) continue
        routes.set(normalizeRoute(route), new Set(chunks.filter(isJsChunk)))
      }
      sources.push('app-build-manifest.json')
    }
  }

  if (existsSync(pagesManifest)) {
    const parsed = (await readJson(pagesManifest)) as
      | { pages?: Record<string, unknown>; rootMainFiles?: unknown; polyfillFiles?: unknown }
      | undefined
    // Files every pages-router route loads regardless of which route it is.
    const shared = [
      ...toStringArray(parsed?.rootMainFiles),
      ...toStringArray(parsed?.polyfillFiles),
    ].filter(isJsChunk)

    if (parsed?.pages && typeof parsed.pages === 'object') {
      for (const [route, chunks] of Object.entries(parsed.pages)) {
        if (!Array.isArray(chunks)) continue
        // `_app` and `_document` are not routes; their chunks are already
        // included in each real route's list by Next.js.
        if (route.startsWith('/_')) continue
        const key = normalizeRoute(route)
        const set = routes.get(key) ?? new Set<string>()
        for (const c of [...chunks, ...shared]) if (isJsChunk(c)) set.add(c)
        routes.set(key, set)
      }
      sources.push('build-manifest.json')
    }
  }

  if (routes.size === 0) return {}

  const sizeCache = new Map<string, number>()
  const startupJsBytes: Record<string, number> = {}
  const allChunks = new Set<string>()

  for (const [route, chunks] of routes) {
    let total = 0
    for (const chunk of chunks) {
      allChunks.add(chunk)
      total += await chunkSize(buildDir, chunk, sizeCache)
    }
    startupJsBytes[route] = total
  }

  let totalStartupJsBytes = 0
  for (const chunk of allChunks) totalStartupJsBytes += await chunkSize(buildDir, chunk, sizeCache)

  return {
    startupJsBytes: sortRecord(startupJsBytes),
    totalStartupJsBytes,
    source: sources.join(' + '),
  }
}

async function chunkSize(buildDir: string, chunk: string, cache: Map<string, number>): Promise<number> {
  const cached = cache.get(chunk)
  if (cached !== undefined) return cached
  let size = 0
  try {
    // Manifest paths are relative to `.next/`, but the emitted files live under
    // `.next/static/...`; both `static/...` and `.next/static/...` appear in the
    // wild depending on version, so try the plain join first.
    const stats = await stat(join(buildDir, chunk))
    size = stats.size
  } catch {
    size = 0
  }
  cache.set(chunk, size)
  return size
}

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return undefined
  }
}

function isJsChunk(value: unknown): value is string {
  return typeof value === 'string' && value.endsWith('.js')
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

/** `/page` and `/(group)/page` both describe the route `/`. */
function normalizeRoute(route: string): string {
  const withoutFile = route.replace(/\/(page|route|layout)$/, '')
  const withoutGroups = withoutFile.replace(/\/\([^)]*\)/g, '')
  return withoutGroups === '' ? '/' : withoutGroups
}

function sortRecord(input: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)))
}

export function formatBytes(bytes: number): string {
  const abs = Math.abs(bytes)
  if (abs < 1024) return `${bytes} B`
  if (abs < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatBytesDelta(bytes: number): string {
  const sign = bytes > 0 ? '+' : bytes < 0 ? '-' : ''
  return `${sign}${formatBytes(Math.abs(bytes))}`
}
