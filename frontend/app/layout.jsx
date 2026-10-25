import './globals.css'

export const metadata = {
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
  title: 'Home & Online Tutor Hub',
  description: 'Connect with verified tutors in your area. Expert home and online tuition for all classes.',
  keywords: 'home tuition, online tutoring, tutor finder, educational platform',
  openGraph: {
    title: 'Home & Online Tutor Hub',
    description: 'Your trusted platform for home and online tuition',
    type: 'website',
  },
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
      </body>
    </html>
  )
}
