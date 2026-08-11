import type { Finding, ScanReport, Severity } from '../types.js'
import { PRODUCT_NAME, PRODUCT_URL, DISCLAIMER } from '../product.js'

/**
 * SARIF 2.1.0 output, for GitHub code scanning and anything else that speaks
 * the format.
 *
 * `partialFingerprints` carries our own fingerprint so code scanning dedupes
 * alerts the same way our diff does. Without it GitHub re-fingerprints by line
 * and every unrelated edit resurrects closed alerts.
 *
 * Spec: https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html
 */
export function toSarif(report: ScanReport): unknown {
  const ruleIds = [...new Set(report.findings.map((f) => f.ruleId))].sort()
  const ruleIndex = new Map(ruleIds.map((id, i) => [id, i]))

  const rules = ruleIds.map((id) => {
    const example = report.findings.find((f) => f.ruleId === id)!
    return {
      id,
      name: toPascal(id),
      shortDescription: { text: example.title },
      fullDescription: { text: example.help },
      helpUri: example.helpUrl,
      help: {
        text: `${example.help}\n\n${DISCLAIMER}`,
      },
      properties: {
        kind: example.kind,
        tags: [
          'accessibility',
          ...example.standards.map((s) =>
            s.framework === 'wcag21' ? `WCAG2.1:${s.id}${s.level ? `:${s.level}` : ''}` : `${s.framework}:${s.id}`,
          ),
        ],
        'security-severity': undefined,
      },
      defaultConfiguration: { level: sarifLevel(example.severity) },
    }
  })

  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: PRODUCT_NAME,
            version: report.tool.version,
            informationUri: PRODUCT_URL,
            rules,
          },
        },
        automationDetails: { id: `${PRODUCT_NAME.toLowerCase()}/${report.scan.id}` },
        results: report.findings.map((f) => toResult(f, ruleIndex.get(f.ruleId) ?? 0)),
        invocations: [
          {
            executionSuccessful: true,
            startTimeUtc: report.scan.startedAt,
            endTimeUtc: report.scan.finishedAt,
            // Layers that did not run are surfaced as notifications so a
            // consumer of the SARIF alone still learns the scan was partial.
            toolExecutionNotifications: report.coverage.layers
              .filter((l) => !l.ran)
              .map((l) => ({
                level: 'note',
                message: { text: `${l.kind} did not run: ${l.reason ?? 'not applicable'}` },
              })),
          },
        ],
        properties: {
          contentHash: report.contentHash,
          disclaimer: report.disclaimer,
          coverage: report.coverage,
        },
      },
    ],
  }
}

function toResult(f: Finding, ruleIndex: number) {
  const base = {
    ruleId: f.ruleId,
    ruleIndex,
    level: sarifLevel(f.severity),
    message: { text: `${f.message} — ${f.help}` },
    partialFingerprints: { attestFingerprint: f.fingerprint },
    properties: {
      surface: f.surface,
      kind: f.kind,
      standards: f.standards,
      boundary: f.boundary,
      evidence: f.evidence,
    },
  }

  switch (f.location.kind) {
    case 'source':
      return {
        ...base,
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri: f.location.file, uriBaseId: '%SRCROOT%' },
              region: {
                startLine: f.location.line,
                startColumn: f.location.column,
                endLine: f.location.endLine,
                endColumn: f.location.endColumn,
              },
            },
          },
        ],
      }
    case 'dom':
      // SARIF has no first-class notion of "a node in a rendered page", so the
      // page is the artifact and the selector is a logical location.
      return {
        ...base,
        locations: [
          {
            physicalLocation: { artifactLocation: { uri: f.location.url } },
            logicalLocations: [{ fullyQualifiedName: f.location.selector, kind: 'element' }],
          },
        ],
      }
    case 'artifact':
      return {
        ...base,
        locations: [
          {
            physicalLocation: { artifactLocation: { uri: f.location.artifact } },
            logicalLocations: f.location.entry
              ? [{ fullyQualifiedName: f.location.entry, kind: 'module' }]
              : undefined,
          },
        ],
      }
  }
}

function sarifLevel(severity: Severity): 'error' | 'warning' | 'note' {
  switch (severity) {
    case 'critical':
    case 'serious':
      return 'error'
    case 'moderate':
      return 'warning'
    case 'minor':
      return 'note'
  }
}

function toPascal(ruleId: string): string {
  return ruleId
    .split(/[/-]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}
