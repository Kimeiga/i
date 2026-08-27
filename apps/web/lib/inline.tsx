import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * A three-token inline formatter for page content: `code`, **strong**, and
 * [links](/href).
 *
 * It builds React nodes rather than HTML, so page content is never passed to
 * `dangerouslySetInnerHTML`. Content authored in JSON is the least trusted
 * input in this codebase — a model writes it — and giving that path the ability
 * to inject markup would be an odd thing for a security-adjacent product to do.
 */
export function renderInline(text: string): ReactNode[] {
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  const parts = text.split(pattern).filter((part) => part !== '')

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      const [, label, href] = link
      const external = href!.startsWith('http')
      return external ? (
        <a key={index} href={href} className="text-[var(--color-accent)] underline">
          {label}
        </a>
      ) : (
        <Link key={index} href={href!} className="text-[var(--color-accent)] underline">
          {label}
        </Link>
      )
    }
    return <span key={index}>{part}</span>
  })
}
