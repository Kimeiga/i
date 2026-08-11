import type { ScanReport } from './types.js'
import { PRODUCT_SLUG } from './product.js'

/**
 * README badge.
 *
 * The badge is a claim surface like any other, so its wording is constrained:
 * it reports a count of findings and the date of the scan. It never says
 * "accessible", "passing" or "conformant", because a green badge that implies
 * conformance is exactly the overlay-vendor failure mode in miniature — and a
 * badge is the single most copied, least read artefact we ship.
 */
export interface BadgeOptions {
  label?: string
  /** Overrides the computed message. Still subject to the wording rules. */
  message?: string
  color?: string
}

export function badgeMessage(report: ScanReport): { message: string; color: string } {
  const n = report.findings.length
  const worst = report.findings.reduce<string>((acc, f) => {
    const order = ['minor', 'moderate', 'serious', 'critical']
    return order.indexOf(f.severity) > order.indexOf(acc) ? f.severity : acc
  }, 'minor')

  if (n === 0) return { message: '0 findings', color: '#4c1' }
  const color = worst === 'critical' || worst === 'serious' ? '#e05d44' : '#dfb317'
  return { message: `${n} finding${n === 1 ? '' : 's'}`, color }
}

export function renderBadge(report: ScanReport, options: BadgeOptions = {}): string {
  const computed = badgeMessage(report)
  const label = options.label ?? PRODUCT_SLUG
  const message = options.message ?? computed.message
  const color = options.color ?? computed.color
  return badgeSvg(label, message, color)
}

/**
 * Minimal flat-style SVG badge. Written by hand rather than fetched from
 * shields.io so the badge keeps working when a README is rendered offline, and
 * so no third party gets a request log of everyone who views the repo.
 */
export function badgeSvg(label: string, message: string, color: string): string {
  const labelWidth = textWidth(label) + 10
  const messageWidth = textWidth(message) + 10
  const total = labelWidth + messageWidth
  const labelX = (labelWidth / 2) * 10
  const messageX = (labelWidth + messageWidth / 2) * 10

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${total}" height="20" role="img" aria-label="${escapeXml(label)}: ${escapeXml(message)}">
  <title>${escapeXml(label)}: ${escapeXml(message)}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${total}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="20" fill="${escapeXml(color)}"/>
    <rect width="${total}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${labelX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(labelWidth - 10) * 10}">${escapeXml(label)}</text>
    <text x="${labelX}" y="140" transform="scale(.1)" textLength="${(labelWidth - 10) * 10}">${escapeXml(label)}</text>
    <text aria-hidden="true" x="${messageX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(messageWidth - 10) * 10}">${escapeXml(message)}</text>
    <text x="${messageX}" y="140" transform="scale(.1)" textLength="${(messageWidth - 10) * 10}">${escapeXml(message)}</text>
  </g>
</svg>`
}

/** Rough advance-width table for 11px Verdana; good enough for a badge. */
function textWidth(text: string): number {
  let width = 0
  for (const ch of text) {
    if (/[iIl1.,:;'|!]/.test(ch)) width += 3
    else if (/[fjrt()[\]-]/.test(ch)) width += 4.5
    else if (/[A-Z]/.test(ch)) width += 8
    else if (/[mwMW]/.test(ch)) width += 10
    else if (ch === ' ') width += 4
    else width += 6.5
  }
  return Math.ceil(width)
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
