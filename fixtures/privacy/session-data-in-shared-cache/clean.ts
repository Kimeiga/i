// None of these should be reported.

// Credentialled but explicitly not cached.
export async function loadCustomerProfile(token: string) {
  const response = await fetch('https://api.example.com/v2/customer_profile', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  return response.json()
}

// Credentialled, and revalidate: 0 opts out of the Data Cache.
export async function loadEntitlements(token: string) {
  const response = await fetch('https://api.example.com/v2/entitlements', {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  })
  return response.json()
}

// Cached, but the response is the same for everyone.
export async function loadProductCatalogue() {
  const response = await fetch('https://api.example.com/v2/products', {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })
  return response.json()
}

// Credentialled with no caching directive at all.
export async function loadInvoices(token: string) {
  const response = await fetch('https://api.example.com/v2/invoices', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.json()
}
