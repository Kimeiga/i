async function sendReceiptEmail(orderId: string): Promise<void> {
  await fetch(`https://mail.example.com/receipts/${orderId}`, { method: 'POST' })
}

async function enqueue(job: { type: string; orderId: string }): Promise<void> {
  await fetch('https://queue.example.com/jobs', { method: 'POST', body: JSON.stringify(job) })
}

export async function POST(request: Request): Promise<Response> {
  const order = (await request.json()) as { id: string }

  // Awaited before the response is returned.
  await sendReceiptEmail(order.id)

  // Handed to something that outlives this request on purpose.
  await enqueue({ type: 'analytics', orderId: order.id })

  return Response.json({ ok: true })
}
