// Public by design: these values are meant to reach the browser.
export const stripePublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
export const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
export const analyticsId = process.env.NEXT_PUBLIC_ANALYTICS_ID
export const jwtPublicKey = process.env.NEXT_PUBLIC_JWT_PUBLIC_KEY

// Secret, and correctly not published: no NEXT_PUBLIC_ prefix.
export const stripeSecret = process.env.STRIPE_SECRET_KEY
export const sessionSecret = process.env.SESSION_SECRET
