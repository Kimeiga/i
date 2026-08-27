'use client'

import { useState } from 'react'
import { track } from '@/lib/events'

/**
 * The primary call to action on every page is a command, not a signup.
 *
 * That is a positioning decision made concrete: the first thing this product
 * asks of a visitor is thirty seconds, not an email address. Copying the
 * command is also the closest observable proxy we have to activation, since the
 * CLI itself reports nothing back by design.
 */
export function CopyCommand({
  command,
  label,
  event,
  variant,
  experiment,
}: {
  command: string
  label: string
  event: string
  variant: string
  experiment?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard access can be denied; the command is visible either way.
    }
    track({ event, variant, experiment })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <code className="rounded border border-[var(--color-line)] px-3 py-2 font-mono text-sm">
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
      >
        {label}
      </button>
      {/* Announced to screen readers when it changes, not only shown. */}
      <span aria-live="polite" className="text-sm text-[var(--color-muted)]">
        {copied ? 'Copied' : ''}
      </span>
    </div>
  )
}
