import retry from 'p-retry'

// A retry around a charge. The origin can process the request and lose the
// response, in which case this bills the customer twice.
export async function charge(amountCents: number, customerId: string) {
  return retry(async () => {
    const response = await fetch('https://api.payments.example.com/v1/charges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents, customerId }),
    })
    if (!response.ok) throw new Error('charge failed')
    return response.json()
  })
}

export async function cancelSubscription(id: string) {
  return retry(async () => {
    const response = await fetch(`https://api.billing.example.com/v1/subscriptions/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error('cancel failed')
    return response.json()
  })
}
