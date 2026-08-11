import { createHmac, timingSafeEqual } from 'node:crypto'
import type { IncomingHttpHeaders } from 'node:http'
import { query } from './db.js'

/**
 * Merchant of Record webhooks.
 *
 * The Merchant of Record is the legal seller and handles VAT, GST and
 * sales-tax remittance across every jurisdiction. That single decision removes
 * 40+ tax registrations from a business with no accountant, which is why there
 * is no Stripe code anywhere in this repository and no tax logic of our own.
 * See gtm/legal/mor-setup.md and DECISIONS.md ADR-0013.
 *
 * All this file does is map a subscription state onto a plan.
 */

export interface BillingEvent {
  event_type: string
  data: {
    id?: string
    customer_id?: string
    subscription_id?: string
    status?: string
    custom_data?: { account_id?: string }
    items?: Array<{ price?: { product_id?: string } }>
  }
}

const PLAN_BY_PRODUCT: Record<string, 'solo' | 'team'> = {
  [process.env.MOR_PRODUCT_SOLO ?? 'product_solo']: 'solo',
  [process.env.MOR_PRODUCT_TEAM ?? 'product_team']: 'team',
}

/**
 * Verifies the webhook signature before anything else touches the payload.
 *
 * An unverified billing webhook is an endpoint that lets anyone on the internet
 * grant themselves a paid plan.
 */
export function verifyWebhookSignature(headers: IncomingHttpHeaders, raw: string): boolean {
  const secret = process.env.MOR_WEBHOOK_SECRET
  if (!secret) {
    console.error('[billing] MOR_WEBHOOK_SECRET is not set; refusing every webhook')
    return false
  }

  const header = headers['paddle-signature'] ?? headers['x-signature']
  if (typeof header !== 'string') return false

  // Paddle sends `ts=<unix>;h1=<hmac>`; a bare hmac is accepted for providers
  // that send one.
  const parts = Object.fromEntries(
    header.split(';').map((part) => {
      const [key, ...rest] = part.split('=')
      return [key?.trim() ?? '', rest.join('=')]
    }),
  )
  const timestamp = parts.ts
  const provided = parts.h1 ?? header

  const payload = timestamp ? `${timestamp}:${raw}` : raw
  const expected = createHmac('sha256', secret).update(payload, 'utf8').digest('hex')

  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(provided, 'utf8')
  if (a.length !== b.length) return false
  if (!timingSafeEqual(a, b)) return false

  // Reject anything more than five minutes old, so a captured webhook cannot be
  // replayed later.
  if (timestamp) {
    const age = Math.abs(Date.now() / 1000 - Number(timestamp))
    if (!Number.isFinite(age) || age > 300) return false
  }
  return true
}

export async function applyBillingEvent(event: BillingEvent): Promise<void> {
  const accountId = event.data.custom_data?.account_id
  if (!accountId) {
    console.error('[billing] event with no account_id', event.event_type)
    return
  }

  switch (event.event_type) {
    case 'subscription.created':
    case 'subscription.updated':
    case 'subscription.resumed': {
      const productId = event.data.items?.[0]?.price?.product_id ?? ''
      const plan = PLAN_BY_PRODUCT[productId] ?? 'free'
      const active = event.data.status === 'active' || event.data.status === 'trialing'
      await setPlan(accountId, active ? plan : 'free', event.data)
      break
    }

    case 'subscription.canceled':
    case 'subscription.paused':
    case 'subscription.past_due':
      // Downgrade, never delete. The evidence trail is the thing they came for
      // and losing it on a failed card is not a retention strategy, it is a
      // reason never to come back.
      await setPlan(accountId, 'free', event.data)
      break

    default:
      break
  }
}

async function setPlan(
  accountId: string,
  plan: 'free' | 'solo' | 'team',
  data: BillingEvent['data'],
): Promise<void> {
  await query(
    `update accounts
     set plan = $2,
         mor_customer_id = coalesce($3, mor_customer_id),
         mor_subscription_id = coalesce($4, mor_subscription_id),
         updated_at = now()
     where id = $1`,
    [accountId, plan, data.customer_id ?? null, data.subscription_id ?? null],
  )
}
