import Link from 'next/link'
import SiteHeader from '../components/landing/SiteHeader'
import { SiteFooter } from '../components/landing/Sections'

export const metadata = {
  title: 'Page not found | Home & Online Tutor Hub',
  description: 'This page could not be found.',
}

// Shown for any URL that does not exist. Every link here points to a live page.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory font-landing text-ink">
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage">Page not found</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">We can&apos;t find that page.</h1>
        <p className="mt-4 text-lg text-sage">The link may be out of date, or the page may have moved.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex min-h-[48px] items-center rounded-full border border-ink bg-lemon px-6 font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">
            Go to the home page
          </Link>
          <Link href="/courses" className="inline-flex min-h-[48px] items-center rounded-full border border-ink/25 bg-white px-6 font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">
            Browse courses
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
