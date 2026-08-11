#!/usr/bin/env node
/**
 * Generates the Ed25519 keypair used to sign evidence exports.
 *
 * The public key is published at /.well-known/attest-signing-key.pem so anyone
 * can verify an export without an account and without trusting us. Rotating it
 * invalidates nothing already signed — old exports name the key id they were
 * signed with, so keep every retired public key published.
 */
import { generateSigningKeypair } from '../dist/evidence.js'

const { publicKey, privateKey, keyId } = generateSigningKeypair()

console.log('# Add to the API environment. Never commit the private key.')
console.log(`EVIDENCE_KEY_ID=${keyId}`)
console.log(`EVIDENCE_PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"`)
console.log(`EVIDENCE_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"`)
console.log()
console.log('# Publish the public key, and keep publishing retired ones:')
console.log(publicKey)
