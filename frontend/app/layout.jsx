import './globals.css'
import { Metadata } from 'next'

export const metadata = {
  title: 'home tution - Home & Online Tuition Platform',
  description: 'Connect with verified tutors in your area. Expert home and online tuition for all classes.',
  keywords: 'home tuition, online tutoring, tutor finder, educational platform',
  openGraph: {
    title: 'home tution',
    description: 'Your trusted platform for home and online tuition',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
