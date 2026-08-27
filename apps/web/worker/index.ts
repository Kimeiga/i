/**
 * The Worker in front of the static assets.
 *
 * It exists for one route. Everything else on this site is a file, and files
 * are served by Cloudflare's asset handling without touching this code.
 *
 * The one route is the first-party event sink described in
 * apps/web/lib/events.ts: no cookie, no identifier, no IP, no user agent, no
 * referrer, nothing that identifies a person. The privacy policy says that is
 * all we collect, so this is the code that has to keep it true — which is why
 * it constructs the stored record field by field rather than spreading the
 * request body into it.
 */

interface Env {
  ASSETS: Fetcher
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/e') {
      if (request.method !== 'POST') {
        return new Response(null, { status: 405, headers: { allow: 'POST' } })
      }
      return recordEvent(request)
    }

    return env.ASSETS.fetch(request)
  },
}

async function recordEvent(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  if (typeof payload.event !== 'string' || payload.event.length > 64) {
    return new Response(null, { status: 400 })
  }

  // Named fields only. A spread here would silently start storing whatever a
  // future client happens to send, which is how a privacy policy becomes false
  // without anyone editing it.
  const record = {
    event: payload.event,
    variant: str(payload.variant, 64),
    experiment: str(payload.experiment, 64),
    viewport: str(payload.viewport, 16),
    at: new Date().toISOString(),
  }

  console.log(JSON.stringify(record))
  return new Response(null, { status: 204 })
}

function str(value: unknown, max: number): string | undefined {
  return typeof value === 'string' ? value.slice(0, max) : undefined
}
