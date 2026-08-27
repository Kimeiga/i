import { randomUUID } from 'node:crypto'
import retry from 'p-retry'

// The key is generated once, outside the retry, so every attempt carries the
// same key and the origin can collapse duplicates.
export async function charge(amountCents: number, customerId: string) {
  const idempotencyKey = randomUUID()
  return retry(async () => {
    const response = await fetch('https://api.payments.example.com/v1/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ amountCents, customerId }),
    })
    if (!response.ok) throw new Error('charge failed')
    return response.json()
  })
}

// Reads are safe to repeat.
export async function loadInvoice(id: string) {
  return retry(async () => {
    const response = await fetch(`https://api.billing.example.com/v1/invoices/${id}`, {
      method: 'GET',
    })
    return response.json()
  })
}

// A POST with no retry around it.
export async function submitFeedback(body: string) {
  const response = await fetch('https://api.example.com/v1/feedback', {
    method: 'POST',
    body,
  })
  return response.ok
}
