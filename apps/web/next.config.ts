import type { NextConfig } from 'next'

/**
 * The site must pass its own scan, so it is deliberately plain: no client-side
 * analytics, no third-party embeds, no fonts loaded from someone else's origin,
 * and no cookie banner because there is nothing to consent to.
 */
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The docs and scan pages are read from markdown files in the repository at
  // build time, so the published site cannot drift from what is in git.
  outputFileTracingIncludes: {
    '/docs/**': ['../../docs/**/*.md'],
    '/scans/**': ['../../gtm/public-scans/*.md'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'x-content-type-options', value: 'nosniff' },
          { key: 'referrer-policy', value: 'strict-origin-when-cross-origin' },
          { key: 'x-frame-options', value: 'DENY' },
        ],
      },
    ]
  },
}

export default config
