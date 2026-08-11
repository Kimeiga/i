import type { NextRequest } from 'next/server'

/**
 * First-party event sink.
 *
 * Accepts only the fields the client sends, stores nothing that identifies a
 * person, sets no cookie, and drops anything oversized. In this repository it
 * logs and discards: wiring it to storage is a task for when there is traffic,
 * and shipping an endpoint that silently retained more than the privacy policy
 * describes would be a worse failure than having no analytics at all.
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }

  const payload = body as { event?: unknown; variant?: unknown; experiment?: unknown; viewport?: unknown }
  if (typeof payload.event !== 'string' || payload.event.length > 64) {
    return new Response(null, { status: 400 })
  }

  const record = {
    event: payload.event,
    variant: typeof payload.variant === 'string' ? payload.variant.slice(0, 64) : undefined,
    experiment: typeof payload.experiment === 'string' ? payload.experiment.slice(0, 64) : undefined,
    viewport: typeof payload.viewport === 'string' ? payload.viewport.slice(0, 16) : undefined,
    // Deliberately absent: IP, user agent, referrer, URL, any identifier, any
    // cookie. The privacy policy says none of those are collected and this is
    // the code that has to keep that true.
    at: new Date().toISOString(),
  }

  console.log('[event]', JSON.stringify(record))
  return new Response(null, { status: 204 })
}
