import type { NextConfig } from 'next'

/**
 * The site is a static export.
 *
 * 54 of its 55 routes were already prerendered, and the one exception — the
 * first-party event sink — is better served by a Worker than by a Node server.
 * Exporting means the whole site is files on a CDN, which is why it can be
 * hosted on a free tier that permits commercial use rather than on a plan that
 * costs $240/year before a single visitor exists. See gtm/costs.md.
 *
 * Two consequences of `output: 'export'` worth knowing: `headers()` and
 * `redirects()` here are ignored, so both moved to `public/_headers` and
 * `public/_redirects`, which Cloudflare reads from the deployed assets.
 */
const config: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  poweredByHeader: false,
  // Emits `about/index.html` rather than `about.html`, which is the shape
  // Cloudflare's asset handling resolves most predictably.
  trailingSlash: true,
  images: { unoptimized: true },
  // The docs and scan pages are read from markdown in the repository at build
  // time, so the published site cannot drift from what is in git.
  outputFileTracingIncludes: {
    '/docs/**': ['../../docs/**/*.md'],
    '/scans/**': ['../../gtm/public-scans/*.md'],
  },
}

export default config
