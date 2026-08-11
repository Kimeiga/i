async function sendReceiptEmail(orderId: string): Promise<void> {
  await fetch(`https://mail.example.com/receipts/${orderId}`, { method: 'POST' })
}

export async function POST(request: Request): Promise<Response> {
  const order = (await request.json()) as { id: string }

  // Never awaited: on a cold serverless instance the process is frozen before
  // this resolves and the receipt is never sent.
  sendReceiptEmail(order.id)

  // Scheduled after the response has already been returned.
  setTimeout(() => {
    void fetch(`https://analytics.example.com/order/${order.id}`, { method: 'POST' })
  }, 5000)

  return Response.json({ ok: true })
}
