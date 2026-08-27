import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * The tool version, read from the package that is actually running.
 *
 * It goes into every report and into the content hash, so it must be the real
 * installed version rather than a constant someone forgets to bump. Read once
 * at module load; a failure falls back to `0.0.0-unknown` rather than throwing,
 * because a version lookup must never be the reason a scan fails.
 */
export const VERSION: string = readVersion()

function readVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  // dist/version.js -> dist -> package root, and src/version.ts under vitest.
  for (const candidate of [join(here, '..', 'package.json'), join(here, '..', '..', 'package.json')]) {
    try {
      const parsed = JSON.parse(readFileSync(candidate, 'utf8')) as { name?: string; version?: string }
      if (parsed.name === '@attestci/cli' && parsed.version) return parsed.version
    } catch {
      /* try the next candidate */
    }
  }
  return '0.0.0-unknown'
}
