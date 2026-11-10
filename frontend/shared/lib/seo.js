// Page metadata and structured data shared by the public pages.
//   pageMetadata   title, description, canonical, Open Graph and Twitter tags for one page. The
//                  share image comes from app/opengraph-image.jsx (and twitter-image.jsx).
//   organizationJsonLd / breadcrumbJsonLd   schema.org objects (rendered with <JsonLd>).
// Keep titles within 60 characters and descriptions within 155; `npm run check:seo` checks it.
import { BRAND_NAME } from '@/shared/brand/Logo'
import { CONTACT, SERVICE_AREA, SOCIAL_PROFILES } from '@/features/website/contact'
import { absoluteUrl } from '@/shared/lib/site'

export const ORGANIZATION_ID = absoluteUrl('/#organization')
// The branded share image (app/opengraph-image.jsx). Next.js only adds a root image file to
// pages that set no Open Graph of their own, so every page names it explicitly here.
export const SHARE_IMAGE_URL = absoluteUrl('/opengraph-image')
export const SHARE_IMAGE_ALT = `Home & Online Tutor Hub: home tutors in ${SERVICE_AREA}`
const SHARE_IMAGE = { url: SHARE_IMAGE_URL, width: 1200, height: 630, alt: SHARE_IMAGE_ALT, type: 'image/png' }

export function pageMetadata({ title, description, path, type = 'website', noindex = false, article }) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: BRAND_NAME,
      locale: 'en_IN',
      type,
      images: [SHARE_IMAGE],
      ...(article ? { publishedTime: article.publishedTime, modifiedTime: article.modifiedTime, authors: [article.author] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, images: [{ url: SHARE_IMAGE_URL, alt: SHARE_IMAGE_ALT }] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  }
}

// Site-wide: who we are. Every page has it (root layout); other objects point to it by @id.
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: BRAND_NAME,
    url: absoluteUrl('/'),
    logo: { '@type': 'ImageObject', url: absoluteUrl('/brand/logo-mark.png'), width: 256, height: 256 },
    telephone: CONTACT.phoneE164,
    ...(CONTACT.email ? { email: CONTACT.email } : {}),
    ...(SOCIAL_PROFILES.length ? { sameAs: SOCIAL_PROFILES } : {}),
  }
}

// items: [{ name, path }], from Home to the current page.
export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: absoluteUrl(item.path) })),
  }
}
