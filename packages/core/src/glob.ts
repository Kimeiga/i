/**
 * A deliberately small glob matcher.
 *
 * Supports the subset real config files use: `**`, `*`, `?`, `{a,b}` and
 * character classes. Written by hand rather than pulled in as a dependency
 * because the CLI's install weight is a distribution cost — every megabyte of
 * transitive dependency is friction on `npx`, and this is 60 lines.
 */

export function globToRegExp(pattern: string): RegExp {
  let out = ''
  let i = 0
  const braceStack: number[] = []

  while (i < pattern.length) {
    const c = pattern[i]!
    if (c === '*') {
      const isDouble = pattern[i + 1] === '*'
      if (isDouble) {
        const nextIsSlash = pattern[i + 2] === '/'
        // `**/` matches zero or more path segments, so `**/*.ts` also matches
        // a top-level `a.ts`.
        out += nextIsSlash ? '(?:[^/]*(?:/|$))*' : '.*'
        i += nextIsSlash ? 3 : 2
      } else {
        out += '[^/]*'
        i += 1
      }
      continue
    }
    if (c === '?') {
      out += '[^/]'
      i += 1
      continue
    }
    if (c === '{') {
      braceStack.push(i)
      out += '(?:'
      i += 1
      continue
    }
    if (c === '}' && braceStack.length > 0) {
      braceStack.pop()
      out += ')'
      i += 1
      continue
    }
    if (c === ',' && braceStack.length > 0) {
      out += '|'
      i += 1
      continue
    }
    if (c === '[') {
      const close = pattern.indexOf(']', i + 1)
      if (close > i) {
        let body = pattern.slice(i + 1, close)
        if (body.startsWith('!')) body = `^${body.slice(1)}`
        out += `[${body}]`
        i = close + 1
        continue
      }
    }
    out += c.replace(/[.+^$()|\\]/g, '\\$&')
    i += 1
  }

  return new RegExp(`^${out}$`)
}

export function matchesAny(path: string, patterns: readonly string[]): boolean {
  const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '')
  return patterns.some((p) => globToRegExp(p).test(normalized))
}
