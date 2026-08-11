import { createHash } from 'node:crypto'

/**
 * Deterministic JSON serialisation.
 *
 * The evidence trail is only worth anything if a third party can recompute the
 * hash we published and get the same string. That requires key order to be
 * fixed, `undefined` to be dropped consistently, and numbers to round-trip.
 * `JSON.stringify` guarantees none of those across engine versions once object
 * key insertion order varies, so we sort explicitly.
 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(normalize(value))
}

function normalize(value: unknown): unknown {
  if (value === null) return null
  if (Array.isArray(value)) return value.map(normalize)
  if (typeof value === 'object') {
    const source = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(source).sort()) {
      const v = normalize(source[key])
      // Dropping undefined rather than emitting null keeps the hash stable
      // whether a caller omits a field or sets it explicitly to undefined.
      if (v !== undefined) out[key] = v
    }
    return out
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new TypeError('Cannot canonicalize non-finite number')
  }
  return value
}

export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

/** `sha256:` prefixed digest, so stored hashes name their own algorithm. */
export function contentDigest(value: unknown): string {
  return `sha256:${sha256(canonicalize(value))}`
}
