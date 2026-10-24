import './globals.css'
import { Metadata } from 'next'

export const metadata = {
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'home tution',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  title: 'home tution - Home & Online Tuition Platform',
  description: 'Connect with verified tutors in your area. Expert home and online tuition for all classes.',
  keywords: 'home tuition, online tutoring, tutor finder, educational platform',
  openGraph: {
    title: 'home tution',
    description: 'Your trusted platform for home and online tuition',
    type: 'website',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
