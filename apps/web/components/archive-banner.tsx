import Link from 'next/link'

/** Marks the preserved first landing page so it cannot be mistaken for current. */
export function ArchiveBanner() {
  return (
    <aside
      aria-label="Archived page notice"
      className="rounded border-2 border-[var(--color-accent)] p-4"
    >
      <p className="font-medium">This is the archived first version of the landing page.</p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Preserved verbatim from commit <code>db780e5</code> so the rewrite can be compared against
        something rather than asserted to be better.{' '}
        <Link href="/compare" className="text-[var(--color-accent)] underline">
          What changed and why
        </Link>{' '}
        · <Link href="/" className="text-[var(--color-accent)] underline">Current page</Link>
      </p>
    </aside>
  )
}
