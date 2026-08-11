// NEXT_PUBLIC_ values are inlined into the browser bundle at build time.

export const stripe = {
  key: process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY,
}

export function signPayload(payload: string): string {
  const secret = process.env.NEXT_PUBLIC_WEBHOOK_SIGNING_SECRET ?? ''
  return `${secret}:${payload}`
}

const { NEXT_PUBLIC_SESSION_KEY } = process.env

export function sessionKey(): string {
  return NEXT_PUBLIC_SESSION_KEY ?? ''
}

export const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
