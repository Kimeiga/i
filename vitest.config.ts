import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const src = (p: string) => fileURLToPath(new URL(`./packages/${p}/src`, import.meta.url))

/**
 * Tests run against `src`, not `dist`, so a failing test points at the line you
 * are editing. The published packages still resolve through `dist` — the alias
 * below only applies under test.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@attestci/core/static': `${src('core')}/static/index.ts`,
      '@attestci/core/testing': `${src('core')}/testing.ts`,
      '@attestci/core': `${src('core')}/index.ts`,
      '@attestci/rules-a11y': `${src('rules-a11y')}/index.ts`,
      '@attestci/rules-privacy': `${src('rules-privacy')}/index.ts`,
      '@attestci/cli': `${src('cli')}/index.ts`,
    },
  },
  test: {
    include: ['packages/**/test/**/*.test.ts'],
    environment: 'node',
    // Rule tests parse real fixture files off disk; the default 5s is tight
    // once ts-morph builds a project.
    testTimeout: 30_000,
    reporters: ['default'],
  },
})
