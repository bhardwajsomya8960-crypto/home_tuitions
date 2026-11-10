import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FaWhatsapp } from 'react-icons/fa'
import SiteHeader from '@/features/website/components/landing/SiteHeader'
import { SiteFooter } from '@/features/website/components/landing/Sections'
import { CITIES, VERIFICATION_ENABLED } from '@/features/website/cities/cities.config'
import { VERIFICATION_STEPS, VERIFY_PATH } from '@/features/website/cities/cityContent'
import { whatsappLink } from '@/features/website/contact'
import { pageMetadata } from '@/shared/lib/seo'
import Breadcrumbs from '@/shared/ui/Breadcrumbs'

// The trust page every "verified" claim links to. It describes only the checks we actually do
// (the same steps as on the city pages). With VERIFICATION_ENABLED off it does not exist.
export const metadata = pageMetadata({
  title: 'How We Verify Tutors | Home & Online Tutor Hub',
  description: 'The checks every tutor goes through before teaching your child: government ID, qualifications, an interview or demo, and your feedback after month one.',
  path: VERIFY_PATH,
})

const btn = 'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-ink px-6 text-base font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory'

export default function HowWeVerifyPage() {
  if (!VERIFICATION_ENABLED) notFound()
  return (
    <div className="min-h-screen bg-ivory font-landing text-ink">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-16">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'How we verify tutors', path: VERIFY_PATH }]} />
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">How we verify tutors</h1>
        <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-ink/85">
          Before a tutor teaches your child, we check who they are and what they know. These are the checks we do, in order.
        </p>

        <ol className="mt-10 space-y-4">
          {VERIFICATION_STEPS.map((step, i) => (
            <li key={step.title} className="rounded-3xl border border-ink/10 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage">Step {i + 1}</p>
              <h2 className="mt-2 text-xl font-bold">{step.title}</h2>
              <p className="mt-2 text-base leading-relaxed text-ink/85">{step.text}</p>
            </li>
          ))}
        </ol>

        <section aria-labelledby="claims-title" className="mt-10">
          <h2 id="claims-title" className="text-2xl font-extrabold tracking-tight">What this does and does not mean</h2>
          <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-ink/85">
            These are our own checks. We do not use third-party badges or certifications, and we do not promise marks or results.
            If anything about a tutor worries you, tell us on WhatsApp or by phone at any time.
          </p>
        </section>

        <section aria-labelledby="find-title" className="mt-10 rounded-3xl bg-lavender/70 p-6 sm:p-8">
          <h2 id="find-title" className="text-xl font-bold">Find a home tutor near you</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {CITIES.map(city => (
              <li key={city.slug}><Link href={`/${city.slug}`} className={`${btn} bg-white`}>Home tutors in {city.name}</Link></li>
            ))}
            <li>
              <a href={whatsappLink('Hi, I have a question about how you verify tutors.')} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#25D366]`}>
                <FaWhatsapp className="h-5 w-5" aria-hidden="true" /> Ask on WhatsApp
              </a>
            </li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
