import { FaWhatsapp } from 'react-icons/fa'
import SiteHeader from '@/features/website/components/landing/SiteHeader'
import { SiteFooter } from '@/features/website/components/landing/Sections'
import { whatsappLink } from '@/features/website/contact'
import { pageMetadata } from '@/shared/lib/seo'

// TODO(tutor page): placeholder. A separate task builds the tutor sign-up form here. Until
// then it points tutors to the homepage's "I want to teach" callback form and WhatsApp, and
// is kept out of search results and the sitemap.
export const metadata = pageMetadata({
  title: 'Become a Tutor | Home & Online Tutor Hub',
  description: 'Teach home and online tuition classes with Home & Online Tutor Hub.',
  path: '/become-a-tutor',
  noindex: true,
})

const btn = 'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-ink px-6 text-base font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory'

export default function BecomeATutorPage() {
  return (
    <div className="min-h-screen bg-ivory font-landing text-ink">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage">For tutors</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Teach with us</h1>
        <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-ink/85">
          Earn alongside your studies or exam prep by teaching students near you, at home or online.
          Our tutor sign-up page is on the way. Until then, leave your number and we&apos;ll call you.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="/#enquire-tutor" className={`${btn} bg-lemon`}>Leave your number</a>
          <a href={whatsappLink("Hello! I'm a tutor and I would like to teach with you. Please share the details.")} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#25D366]`}>
            <FaWhatsapp className="h-5 w-5" aria-hidden="true" /> Message us on WhatsApp
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
