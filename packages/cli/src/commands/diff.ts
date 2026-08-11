import { resolve } from 'node:path'
import {
  diffReports,
  readReport,
  renderDiff,
  renderPrComment,
  shouldUseColor,
  writeText,
} from '@attestci/core'
import type { CliIo } from '../io.js'

export interface DiffOptions {
  base: string
  head: string
  format: 'terminal' | 'markdown' | 'json'
  output?: string
  /** Exit non-zero when the diff introduces findings. */
  failOnRegression?: boolean
  dashboardUrl?: string
  fileUrlBase?: string
}

/**
 * `attest diff base.json head.json` — the semantic diff.
 *
 * This is the command the GitHub Action runs, and its markdown output is the
 * pull request comment.
 */
export async function diffCommand(options: DiffOptions, io: CliIo): Promise<number> {
  const base = await readReport(resolve(options.base))
  const head = await readReport(resolve(options.head))
  const diff = diffReports(base, head)

  let rendered: string
  switch (options.format) {
    case 'json':
      rendered = JSON.stringify(diff, null, 2)
      break
    case 'markdown':
      rendered = renderPrComment(diff, head, {
        dashboardUrl: options.dashboardUrl,
        fileUrlBase: options.fileUrlBase,
      })
      break
    case 'terminal':
      rendered = renderDiff(diff, { color: shouldUseColor() })
      break
  }

  if (options.output) await writeText(resolve(options.output), rendered)
  else io.out(rendered)

  const regressed = diff.verdict === 'regressed' || diff.verdict === 'mixed'
  return options.failOnRegression && regressed ? 1 : 0
}
