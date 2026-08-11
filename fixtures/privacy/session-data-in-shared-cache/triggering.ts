// Each of these fetches sends a per-session credential AND asks to be cached,
// which puts one visitor's response in a cache the next visitor reads from.

export async function loadCustomerProfile(token: string) {
  const response = await fetch('https://api.example.com/v2/customer_profile', {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  })
  return response.json()
}

export async function loadEntitlements(token: string) {
  const response = await fetch('https://api.example.com/v2/entitlements', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'force-cache',
  })
  return response.json()
}

export async function loadCart() {
  const response = await fetch('https://api.example.com/v2/cart', {
    credentials: 'include',
    next: { tags: ['cart'] },
  })
  return response.json()
}
