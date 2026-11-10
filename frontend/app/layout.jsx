import './globals.css'
import WhatsAppWidget from '@/features/website/components/WhatsAppWidget'
import StudyCorner from '@/features/website/components/StudyCorner'
import SiteAnalytics from '@/features/website/components/SiteAnalytics'
import { SITE_URL } from '@/shared/lib/site'
import { organizationJsonLd } from '@/shared/lib/seo'
import JsonLd from '@/shared/ui/JsonLd'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Home & Online Tutor Hub',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' }],
    apple: '/icons/apple-touch-icon.png',
  },
  // Defaults for pages without their own; public pages set theirs with pageMetadata (shared/lib/seo.js).
  // The share image for every page comes from app/opengraph-image.jsx and app/twitter-image.jsx.
  title: 'Home & Online Tutor Hub',
  description: 'Home and online tutors for every class in Noida and Delhi NCR. Leave your number and we will call you back.',
  openGraph: {
    title: 'Home & Online Tutor Hub',
    description: 'Home and online tutors for every class in Noida and Delhi NCR.',
    siteName: 'Home & Online Tutor Hub',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFFCF4',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        {children}
        <StudyCorner />
        <WhatsAppWidget />
        <SiteAnalytics />
        {/* Organization structured data on every page (logo, phone, profiles). */}
        <JsonLd data={organizationJsonLd()} />
      </body>
    </html>
  )
}
