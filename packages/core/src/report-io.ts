import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { ScanReport } from './types.js'
import { canonicalize } from './canonical.js'
import { computeContentHash } from './engine.js'

export class ReportFormatError extends Error {}

/**
 * Reads a report and refuses to hand back something that is not one.
 *
 * The hash check is on by default. A stored report whose contents no longer
 * match its own hash has been edited after the fact, and silently accepting it
 * would defeat the only thing the evidence trail is for. Callers who genuinely
 * need to inspect a tampered or hand-edited file must ask for it explicitly.
 */
export async function readReport(path: string, options: { verifyHash?: boolean } = {}): Promise<ScanReport> {
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch (err) {
    throw new ReportFormatError(`Could not read report at ${path}: ${(err as Error).message}`)
  }
  return parseReport(raw, options)
}

export function parseReport(raw: string, options: { verifyHash?: boolean } = {}): ScanReport {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch (err) {
    throw new ReportFormatError(`Report is not valid JSON: ${(err as Error).message}`)
  }
  const report = assertReport(value)
  if (options.verifyHash !== false && computeContentHash(report) !== report.contentHash) {
    throw new ReportFormatError(
      'Report content hash does not match its contents. The file has been modified since it was produced, ' +
        'or was written by a different tool version. Re-run the scan rather than trusting this file.',
    )
  }
  return report
}

export function assertReport(value: unknown): ScanReport {
  if (typeof value !== 'object' || value === null) {
    throw new ReportFormatError('Report must be a JSON object')
  }
  const r = value as Partial<ScanReport>
  if (r.schemaVersion !== '1') {
    throw new ReportFormatError(
      `Unsupported report schemaVersion ${JSON.stringify(r.schemaVersion)}; this build understands "1"`,
    )
  }
  for (const key of ['tool', 'scan', 'target', 'coverage'] as const) {
    if (typeof r[key] !== 'object' || r[key] === null) {
      throw new ReportFormatError(`Report is missing required object field "${key}"`)
    }
  }
  for (const key of ['findings', 'rulesRun', 'rulesSkipped'] as const) {
    if (!Array.isArray(r[key])) throw new ReportFormatError(`Report field "${key}" must be an array`)
  }
  // `suppressed` was added alongside schema v1 but tolerate its absence so a
  // report written by an early build still loads.
  if (r.suppressed !== undefined && !Array.isArray(r.suppressed)) {
    throw new ReportFormatError('Report field "suppressed" must be an array')
  }
  if (typeof r.contentHash !== 'string' || !r.contentHash.startsWith('sha256:')) {
    throw new ReportFormatError('Report is missing a sha256 contentHash')
  }
  const report = value as ScanReport
  return {
    ...report,
    suppressed: report.suppressed ?? [],
    metrics: report.metrics ?? {},
  }
}

export async function writeReport(path: string, report: ScanReport): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  // Canonical form on disk, so the bytes a user commits are the bytes we hashed.
  await writeFile(path, `${canonicalize(report)}\n`, 'utf8')
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export async function writeText(path: string, text: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, text.endsWith('\n') ? text : `${text}\n`, 'utf8')
}
