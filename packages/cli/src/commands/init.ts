import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { CONFIG_FILENAME, DEFAULT_CONFIG, PRODUCT_SLUG, writeText } from '@attestci/core'
import type { CliIo } from '../io.js'

export interface InitOptions {
  dir: string
  force?: boolean
}

/** `attest init` — write a config file with the defaults spelled out. */
export async function initCommand(options: InitOptions, io: CliIo): Promise<number> {
  const target = join(resolve(options.dir), CONFIG_FILENAME)
  if (existsSync(target) && !options.force) {
    io.error(`${CONFIG_FILENAME} already exists. Pass --force to overwrite it.`)
    return 2
  }

  // Written with the real defaults inline rather than an empty object, so the
  // file documents what the tool does without anyone opening the docs.
  const config = {
    $schema: `https://attest.ci/schema/${PRODUCT_SLUG}.config.schema.json`,
    include: DEFAULT_CONFIG.include,
    exclude: ['**/generated/**'],
    urls: [],
    failOn: DEFAULT_CONFIG.failOn,
    failOnNewOnly: false,
    rules: {},
  }

  await writeText(target, JSON.stringify(config, null, 2))
  io.out(`Wrote ${CONFIG_FILENAME}.`)
  io.out('')
  io.out('Next:')
  io.out('  attest scan .                       source-level checks, no browser needed')
  io.out('  attest scan . --url http://localhost:3000   adds the runtime accessibility checks')
  io.out('')
  io.out('Runtime checks need Playwright: npm i -D playwright && npx playwright install chromium')
  return 0
}
