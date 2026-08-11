#!/usr/bin/env node
/**
 * Refuses a publish that would ship a broken tarball.
 *
 * `npm pack` and `npm publish` do not rewrite pnpm's `workspace:*` protocol, so
 * they produce a package whose dependencies read `workspace:*` and which fails
 * to install with EUNSUPPORTEDPROTOCOL. `pnpm publish` rewrites them to real
 * versions.
 *
 * This is not hypothetical: the first pack of these packages produced exactly
 * that tarball, and it was caught by installing it into a clean project rather
 * than by reading the manifest. The CI job that does that install is the reason
 * this guard exists, and this guard is the reason a tired founder cannot
 * bypass it at 1am with `npm publish`.
 */
const agent = process.env.npm_config_user_agent ?? ''

if (!agent.startsWith('pnpm')) {
  console.error('')
  console.error('Refusing to publish: use `pnpm publish`, not npm.')
  console.error('')
  console.error('npm does not rewrite the `workspace:*` protocol, so the tarball it')
  console.error('produces declares dependencies nobody can install:')
  console.error('')
  console.error('  npm error Unsupported URL Type "workspace:": workspace:*')
  console.error('')
  console.error('Run `pnpm -r publish --access public` from the repository root.')
  console.error('')
  process.exit(1)
}
