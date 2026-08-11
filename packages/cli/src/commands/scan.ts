import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import {
  PRODUCT_NAME,
  diffReports,
  discoverFiles,
  loadConfig,
  newFingerprints,
  readReport,
  renderDiff,
  renderScan,
  renderScanMarkdown,
  resolveConfig,
  runScan,
  shouldFail,
  shouldUseColor,
  toSarif,
  writeJson,
  writeReport,
  writeText,
  type AnyRulePack,
  type ProgressEvent,
  type ResolvedConfig,
  type ScanInput,
  type ScanReport,
} from '@attestci/core'
import { createRuntimeA11yPack, staticA11yPack } from '@attestci/rules-a11y'
import { clientImpactPack, privacyPack } from '@attestci/rules-privacy'
import { readGitContext } from '../git.js'
import { VERSION } from '../version.js'
import type { CliIo } from '../io.js'

export interface ScanOptions {
  dir: string
  urls: string[]
  buildDir?: string
  configPath?: string
  json?: string
  sarif?: string
  markdown?: string
  baseline?: string
  failOn?: ResolvedConfig['failOn']
  failOnNewOnly?: boolean
  chromiumPath?: string
  quiet?: boolean
  format: 'terminal' | 'json'
}

/**
 * `attest scan` — run every applicable layer over a directory and report.
 *
 * The exit code is the contract with CI: 0 means nothing at or above the
 * configured severity, 1 means there is. A layer that could not run never
 * changes the exit code, because "we did not look" must not read as "we looked
 * and it was fine".
 */
export async function scanCommand(options: ScanOptions, io: CliIo): Promise<number> {
  const rootDir = resolve(options.dir)
  if (!existsSync(rootDir)) {
    io.error(`No such directory: ${rootDir}`)
    return 2
  }

  const userConfig = await loadConfig(options.configPath ? resolve(options.configPath) : rootDir)
  const config = resolveConfig(userConfig, {
    urls: options.urls.length > 0 ? options.urls : undefined,
    failOn: options.failOn,
    failOnNewOnly: options.failOnNewOnly,
    buildDir: options.buildDir,
  })

  const files = await discoverFiles(rootDir, config.include, config.exclude)
  const buildDir = resolveBuildDir(rootDir, config.buildDir)

  const input: ScanInput = {
    rootDir,
    files,
    urls: config.urls,
    buildDir,
    config,
    shared: new Map(),
  }

  const packs: AnyRulePack[] = [
    staticA11yPack,
    createRuntimeA11yPack({ executablePath: options.chromiumPath }),
    privacyPack,
    clientImpactPack,
  ]

  const git = await readGitContext(rootDir)
  const report = await runScan(input, packs, {
    toolVersion: VERSION,
    ...git,
    onProgress: options.quiet ? undefined : (event) => io.error(progressLine(event)),
  })

  await writeOutputs(report, options)

  // A baseline turns the run into a comparison, which is the mode that matters
  // in a pull request.
  let newOnly: Set<string> | undefined
  if (options.baseline) {
    const base = await readReport(resolve(options.baseline))
    const diff = diffReports(base, report)
    newOnly = newFingerprints(diff)
    if (options.format === 'terminal') {
      io.out(renderDiff(diff, { color: shouldUseColor() }))
      io.out('')
    }
  }

  if (options.format === 'json') {
    io.out(JSON.stringify(report, null, 2))
  } else {
    io.out(renderScan(report, { color: shouldUseColor() }))
  }

  const failing = shouldFail(report, config.failOn, config.failOnNewOnly ? newOnly : undefined)
  if (failing) {
    io.error('')
    io.error(
      `${PRODUCT_NAME}: findings at or above "${config.failOn}" are present. ` +
        `This is a report on automated checks, not a compliance determination.`,
    )
  }
  return failing ? 1 : 0
}

async function writeOutputs(report: ScanReport, options: ScanOptions): Promise<void> {
  if (options.json) await writeReport(resolve(options.json), report)
  if (options.sarif) await writeJson(resolve(options.sarif), toSarif(report))
  if (options.markdown) await writeText(resolve(options.markdown), renderScanMarkdown(report))
}

/**
 * Only use a build directory that exists. Passing a path that is not there and
 * getting an empty metrics object back would be indistinguishable from a build
 * with no JavaScript in it.
 */
function resolveBuildDir(rootDir: string, configured: string | undefined): string | undefined {
  const candidates = configured ? [resolve(rootDir, configured)] : [resolve(rootDir, '.next')]
  return candidates.find((candidate) => existsSync(candidate))
}

function progressLine(event: ProgressEvent): string {
  switch (event.type) {
    case 'pack-start':
      return `  running ${event.packId}…`
    case 'pack-skip':
      return `  skipped ${event.packId}: ${event.reason}`
    case 'pack-done':
      return `  ${event.packId}: ${event.findings} finding(s) in ${event.durationMs}ms`
    case 'rule-error':
      return `  rule ${event.ruleId} failed and was skipped: ${event.error}`
  }
}
