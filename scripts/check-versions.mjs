#!/usr/bin/env node
/**
 * Every publishable package carries the same version, and it matches the git
 * tag being released.
 *
 * Mismatched versions across a workspace produce the worst kind of release: one
 * that succeeds. Half the packages go out, the dependency ranges no longer
 * resolve to each other, and the first person to install it gets a broken tree
 * from a registry that will not let you unpublish after 72 hours.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const PACKAGES = ['core', 'rules-a11y', 'rules-privacy', 'cli', 'action']

const versions = new Map()
for (const name of PACKAGES) {
  const manifest = JSON.parse(await readFile(join(repoRoot, 'packages', name, 'package.json'), 'utf8'))
  versions.set(manifest.name, manifest.version)
}

const distinct = new Set(versions.values())
if (distinct.size !== 1) {
  console.error('check-versions: packages disagree about the version.\n')
  for (const [name, version] of versions) console.error(`  ${name.padEnd(28)} ${version}`)
  console.error('\nSet them all to the same version before releasing.\n')
  process.exit(1)
}

const version = [...distinct][0]

// On a tag build, the tag has to agree too.
const ref = process.env.GITHUB_REF_NAME
if (ref?.startsWith('v')) {
  const tagged = ref.slice(1)
  if (tagged !== version) {
    console.error(`check-versions: tag ${ref} does not match package version ${version}.`)
    process.exit(1)
  }
}

console.log(`check-versions: ${PACKAGES.length} packages at ${version}${ref ? ` (tag ${ref})` : ''}`)
