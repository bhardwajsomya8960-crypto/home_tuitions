const withPWA = require('@ducanh2912/next-pwa').default

const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').origin
  } catch {
    return null
  }
})()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Each dev server needs its own build dir; several servers sharing .next serve 404s
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
}

module.exports = withPWA({
  dest: 'public',
  // Service worker is only built for production; dev server stays uncached
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline',
  },
  // Replaces the defaults, which cache same-origin /api/ responses. Authenticated
  // API data must never be stored, so API calls are network-only.
  extendDefaultRuntimeCaching: false,
  workboxOptions: {
    // New versions wait until the user accepts the update banner
    skipWaiting: false,
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api/') || (apiOrigin !== null && url.origin === apiOrigin),
        handler: 'NetworkOnly',
      },
      {
        // Pages are never cached (they can render account data). When the network
        // fails, the plugin's document fallback serves the precached /offline page.
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkOnly',
        options: {},
      },
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
      },
      {
        urlPattern: /\/_next\/static\/.+\.(?:js|css)$/i,
        handler: 'CacheFirst',
        options: { cacheName: 'next-static-assets', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)$/i,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'static-assets', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 } },
      },
    ],
  },
})(nextConfig)
