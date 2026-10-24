import Link from 'next/link'

// Shown when the catalogue API cannot be reached. Deliberately does not show sample courses.
export default function CatalogueUnavailable({ retryHref = '/courses', message = 'We could not load courses right now.' }) {
  return (
    <div role="status" className="rounded-3xl border border-ink/10 bg-white p-8 text-center">
      <p className="font-semibold text-ink">{message}</p>
      <p className="mt-2 text-sm text-sage">Please try again in a moment.</p>
      <Link
        href={retryHref}
        className="mt-5 inline-flex min-h-[44px] items-center rounded-full border border-ink bg-lemon px-5 font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        Try again
      </Link>
    </div>
  )
}
