import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto'
import { canonicalize, computeContentHash, type ScanReport } from '@attestci/core'

/**
 * The hash chain, and the signature over an export.
 *
 * Two separate guarantees, and they are worth keeping distinct:
 *
 *  - The **content hash** proves a report describes what it says it describes.
 *    Anyone with the source at that commit and the same tool version can
 *    recompute it without trusting us.
 *  - The **chain hash** proves a report has not been removed from or reordered
 *    within a repository's history. That one does require trusting that we did
 *    not rewrite the whole chain, which is why exports are signed and why the
 *    append-only rule is a database trigger rather than a promise.
 */

export interface ChainLink {
  contentHash: string
  prevHash: string | null
  chainHash: string
  scannedAt: string
}

/** `chainHash = sha256(prevHash ?? '' | contentHash | scannedAt)`. */
export function computeChainHash(
  prevHash: string | null,
  contentHash: string,
  scannedAt: string,
): string {
  const material = `${prevHash ?? 'genesis'}\n${contentHash}\n${scannedAt}`
  return `sha256:${createHash('sha256').update(material, 'utf8').digest('hex')}`
}

export interface ChainVerification {
  valid: boolean
  /** Index of the first link that failed, or -1 when the chain is intact. */
  brokenAt: number
  reason?: string
}

/**
 * Walks a repository's chain in order and reports exactly where it breaks.
 *
 * "The chain is invalid" is not a useful answer to anyone. "Record 47, scanned
 * on 3 March, does not link to record 46" is.
 */
export function verifyChain(links: readonly ChainLink[]): ChainVerification {
  let expectedPrev: string | null = null

  for (let i = 0; i < links.length; i++) {
    const link = links[i]!
    if (link.prevHash !== expectedPrev) {
      return {
        valid: false,
        brokenAt: i,
        reason:
          `record ${i} (scanned ${link.scannedAt}) links to ${link.prevHash ?? 'genesis'}, ` +
          `but the previous record's chain hash is ${expectedPrev ?? 'genesis'}. ` +
          `A record has been removed, reordered, or altered.`,
      }
    }
    const recomputed = computeChainHash(link.prevHash, link.contentHash, link.scannedAt)
    if (recomputed !== link.chainHash) {
      return {
        valid: false,
        brokenAt: i,
        reason: `record ${i} (scanned ${link.scannedAt}) has a chain hash that does not match its own contents`,
      }
    }
    expectedPrev = link.chainHash
  }

  return { valid: true, brokenAt: -1 }
}

/** Rejects a report whose stored contents no longer match its own hash. */
export function verifyReport(report: ScanReport): boolean {
  return computeContentHash(report) === report.contentHash
}

/* -------------------------------- exports -------------------------------- */

export interface ExportManifest {
  schemaVersion: '1'
  tool: string
  repository: string
  generatedAt: string
  scanCount: number
  from: { scannedAt: string; contentHash: string } | null
  to: { scannedAt: string; contentHash: string } | null
  chain: ChainLink[]
  /**
   * Restated inside the export, because an export is the artefact most likely
   * to be read by someone who has never seen the product and most likely to be
   * over-read as a certificate.
   */
  disclaimer: string
  coverageNote: string
  verificationInstructions: string
}

export const VERIFICATION_INSTRUCTIONS = [
  'To verify this export without trusting the issuer:',
  '',
  '1. Check the signature over `manifest` using the public key at the URL in `keyUrl`.',
  '   The signature algorithm is Ed25519 and the signed bytes are the canonical',
  '   JSON serialisation of `manifest` (sorted keys, no whitespace).',
  '',
  '2. Recompute each report\'s content hash: canonicalise the object',
  '   { schemaVersion, tool, urls, rulesRun, rulesSkipped, findings, suppressed,',
  '   metrics, coverage } and take its SHA-256. It must equal `contentHash`.',
  '',
  '3. Walk the chain: each record\'s `prevHash` must equal the previous record\'s',
  '   `chainHash`, and each `chainHash` must equal',
  '   sha256(prevHash + "\\n" + contentHash + "\\n" + scannedAt).',
  '',
  '4. To verify a report against the code it describes, check out the recorded',
  '   commit and run the same tool version. Identical code produces an identical',
  '   content hash on any machine.',
  '',
  'This export records what automated checks found. It is not a certificate, an',
  'audit, or a determination of conformance with any standard.',
].join('\n')

export interface SignedExport {
  manifest: ExportManifest
  signature: string
  keyId: string
  keyUrl: string
  reports: ScanReport[]
}

/**
 * Ed25519 over the canonical serialisation of the manifest.
 *
 * The one-shot `sign`/`verify` API is required here rather than the streaming
 * Sign/Verify objects: Ed25519 hashes internally and refuses a caller-supplied
 * digest, so the algorithm argument is `null`. The signed bytes are exactly
 * `canonicalize(manifest)` — sorted keys, no whitespace — which is what makes
 * the published verification instructions followable by someone with any
 * Ed25519 implementation.
 */
export function signManifest(manifest: ExportManifest, privateKeyPem: string): string {
  return sign(null, Buffer.from(canonicalize(manifest), 'utf8'), privateKeyPem).toString('base64')
}

export function verifyManifest(
  manifest: ExportManifest,
  signature: string,
  publicKeyPem: string,
): boolean {
  try {
    return verify(
      null,
      Buffer.from(canonicalize(manifest), 'utf8'),
      publicKeyPem,
      Buffer.from(signature, 'base64'),
    )
  } catch {
    return false
  }
}

/** For local development and for rotating the published signing key. */
export function generateSigningKeypair(): { publicKey: string; privateKey: string; keyId: string } {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString()
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
  const keyId = createHash('sha256').update(publicPem).digest('hex').slice(0, 16)
  return { publicKey: publicPem, privateKey: privatePem, keyId }
}
