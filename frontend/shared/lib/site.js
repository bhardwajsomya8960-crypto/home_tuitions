// The public address of the website, used for canonical URLs, Open Graph, the sitemap and
// structured data. Set NEXT_PUBLIC_SITE_URL to override it (for example on a staging site).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://hometuitions.koshatech.com').replace(/\/+$/, '')

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
