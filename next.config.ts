import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { getProductImageRewrites } from './lib/store-images'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  output: 'standalone',
  // Resolve canonical and robots metadata before sending the HTML head.
  htmlLimitedBots: /.*/,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },

  async rewrites() {
    return { beforeFiles: [], afterFiles: [], fallback: getProductImageRewrites() }
  },

  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ]

    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      })
    }

    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=300, must-revalidate' }],
      },
    ]
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default withNextIntl(nextConfig)
