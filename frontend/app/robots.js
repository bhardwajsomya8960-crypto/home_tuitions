import { absoluteUrl } from '@/shared/lib/site'

// /robots.txt: everything public is crawlable (city pages included); staff and account areas
// and the API are not.
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/parent/dashboard', '/tutor/dashboard', '/api/'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
