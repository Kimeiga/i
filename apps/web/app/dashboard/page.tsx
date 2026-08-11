import type { Metadata } from 'next'
import { PRODUCT_NAME } from '@attestci/core'

export const metadata: Metadata = { title: 'Dashboard' }

/**
 * The dashboard is dense and boring on purpose: tables, counts, diffs, hashes.
 * No animation, no gauges, no score out of 100. A score would be a compliance
 * claim wearing a number, and the audience is engineers who want to know what
 * changed and when.
 *
 * This renders sample data. The real dashboard reads from the API; wiring it to
 * a live account is the next task after the API is deployed.
 */

interface Row {
  scannedAt: string
  commit: string
  ref: string
  findings: number
  critical: number
  serious: number
  moderate: number
  minor: number
  suppressed: number
  layersRan: string[]
  layersSkipped: string[]
  contentHash: string
}

const SAMPLE: Row[] = [
  {
    scannedAt: '2026-08-11T09:14:02Z',
    commit: '9f2c1ab',
    ref: 'main',
    findings: 12,
    critical: 0,
    serious: 7,
    moderate: 5,
    minor: 0,
    suppressed: 2,
    layersRan: ['runtime-a11y', 'static-a11y', 'static-privacy', 'client-impact'],
    layersSkipped: [],
    contentHash: 'sha256:4b1f9c…',
  },
  {
    scannedAt: '2026-08-10T17:41:55Z',
    commit: '3ad81c0',
    ref: 'main',
    findings: 15,
    critical: 1,
    serious: 8,
    moderate: 6,
    minor: 0,
    suppressed: 2,
    layersRan: ['runtime-a11y', 'static-a11y', 'static-privacy', 'client-impact'],
    layersSkipped: [],
    contentHash: 'sha256:c02e71…',
  },
  {
    scannedAt: '2026-08-09T11:02:13Z',
    commit: 'ee40b12',
    ref: 'main',
    findings: 9,
    critical: 0,
    serious: 6,
    moderate: 3,
    minor: 0,
    suppressed: 1,
    // A scan where a layer did not run is shown as such, in the same table.
    // Hiding it would make the count on that row look like an improvement.
    layersRan: ['static-a11y', 'static-privacy', 'client-impact'],
    layersSkipped: ['runtime-a11y'],
    contentHash: 'sha256:88ad3f…',
  },
]

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">acme/storefront</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {SAMPLE.length} scans · chain verified · retention 7 years
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">History</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Scan history for acme/storefront, newest first
            </caption>
            <thead>
              <tr>
                {[
                  'Scanned',
                  'Commit',
                  'Ref',
                  'Findings',
                  'Critical',
                  'Serious',
                  'Moderate',
                  'Suppressed',
                  'Coverage',
                  'Hash',
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="border border-[var(--color-line)] px-3 py-2 text-left font-medium"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE.map((row) => (
                <tr key={row.contentHash}>
                  <td className="border border-[var(--color-line)] px-3 py-2">
                    <time dateTime={row.scannedAt}>{row.scannedAt.replace('T', ' ').replace('Z', '')}</time>
                  </td>
                  <td className="border border-[var(--color-line)] px-3 py-2 font-mono">{row.commit}</td>
                  <td className="border border-[var(--color-line)] px-3 py-2">{row.ref}</td>
                  <td className="border border-[var(--color-line)] px-3 py-2">{row.findings}</td>
                  <td className="border border-[var(--color-line)] px-3 py-2">{row.critical}</td>
                  <td className="border border-[var(--color-line)] px-3 py-2">{row.serious}</td>
                  <td className="border border-[var(--color-line)] px-3 py-2">{row.moderate}</td>
                  <td className="border border-[var(--color-line)] px-3 py-2">{row.suppressed}</td>
                  <td className="border border-[var(--color-line)] px-3 py-2">
                    {row.layersSkipped.length === 0 ? (
                      'all layers'
                    ) : (
                      <span>
                        {row.layersRan.length} of {row.layersRan.length + row.layersSkipped.length} —{' '}
                        <strong>{row.layersSkipped.join(', ')} did not run</strong>
                      </span>
                    )}
                  </td>
                  <td className="border border-[var(--color-line)] px-3 py-2 font-mono text-xs">
                    {row.contentHash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          A row where a layer did not run says so. The finding count on that row is not comparable
          with the others, and neither {PRODUCT_NAME} nor this table pretends otherwise.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Evidence</h2>
        <ul className="text-sm">
          <li>Hash chain: verified across {SAMPLE.length} records</li>
          <li>Storage: append-only, enforced by database constraint</li>
          <li>Export: signed JSON and PDF, verifiable without an account</li>
        </ul>
      </section>
    </div>
  )
}
