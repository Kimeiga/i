import { resolve } from 'node:path'
import { readReport, renderBadge, writeText } from '@attestci/core'
import type { CliIo } from '../io.js'

export interface BadgeOptions {
  report: string
  output?: string
  label?: string
}

/**
 * `attest badge report.json` — an SVG for the README.
 *
 * The badge reports a count and nothing else. It never says "passing",
 * "accessible" or "conformant", because a green badge implying conformance is
 * the overlay-vendor failure mode in miniature, and a badge is the most copied
 * and least read thing we produce.
 */
export async function badgeCommand(options: BadgeOptions, io: CliIo): Promise<number> {
  const report = await readReport(resolve(options.report))
  const svg = renderBadge(report, { label: options.label })

  if (options.output) await writeText(resolve(options.output), svg)
  else io.out(svg)
  return 0
}
