import { readdir, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { matchesAny } from './glob.js'

/**
 * Walks a project and returns repo-relative POSIX paths matching the config.
 *
 * Directory pruning matters: on a real Next.js repo `node_modules` and `.next`
 * are 95% of the inodes, and descending into them turns a two-second scan into
 * a two-minute one.
 */
export async function discoverFiles(
  rootDir: string,
  include: readonly string[],
  exclude: readonly string[],
): Promise<string[]> {
  const out: string[] = []
  await walk(rootDir, rootDir, include, exclude, out, 0)
  return out.sort()
}

const ALWAYS_PRUNE = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.turbo', '.vercel'])
const MAX_DEPTH = 24

async function walk(
  rootDir: string,
  dir: string,
  include: readonly string[],
  exclude: readonly string[],
  out: string[],
  depth: number,
): Promise<void> {
  if (depth > MAX_DEPTH) return
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    // Unreadable directory: skip rather than abort. A permissions error deep
    // in someone's repo should not fail their CI run.
    return
  }

  for (const entry of entries) {
    const abs = join(dir, entry.name)
    const rel = toPosix(relative(rootDir, abs))

    if (entry.isDirectory()) {
      if (ALWAYS_PRUNE.has(entry.name)) continue
      if (matchesAny(`${rel}/`, exclude) || matchesAny(rel, exclude)) continue
      await walk(rootDir, abs, include, exclude, out, depth + 1)
      continue
    }

    if (entry.isSymbolicLink()) {
      // Follow only if it resolves to a regular file inside the root, to avoid
      // walking out of the repository or into a cycle.
      try {
        const target = await stat(abs)
        if (!target.isFile()) continue
      } catch {
        continue
      }
    } else if (!entry.isFile()) {
      continue
    }

    if (matchesAny(rel, exclude)) continue
    if (!matchesAny(rel, include)) continue
    out.push(rel)
  }
}

export function toPosix(p: string): string {
  return sep === '/' ? p : p.split(sep).join('/')
}
