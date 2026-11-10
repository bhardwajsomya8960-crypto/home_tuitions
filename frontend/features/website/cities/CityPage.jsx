import Link from 'next/link'
import { FaWhatsapp } from 'react-icons/fa'
import { FiArrowRight, FiChevronDown, FiClock, FiGift, FiMapPin, FiMessageCircle, FiShield, FiUser } from 'react-icons/fi'
import SiteHeader from '@/features/website/components/landing/SiteHeader'
import { SiteFooter } from '@/features/website/components/landing/Sections'
import Breadcrumbs from '@/shared/ui/Breadcrumbs'
import JsonLd from '@/shared/ui/JsonLd'
import { VERIFICATION_ENABLED } from './cities.config'
import {
  SUBJECTS_AND_LEVELS, VERIFICATION_STEPS, VERIFY_PATH, breadcrumbItems, cityFaqs, faqJsonLd, heroHeading, howItWorks,
  localBusinessJsonLd, nearbyAreasFor, placeName, tutorRequestText, whatsappDigits, whatsappHref, whyCards,
} from './cityContent'
import CityLeadForm from './CityLeadForm'
import StickyContactBar from './StickyContactBar'
import TrackedLink from './TrackedLink'

// The landing page for one city (/noida) or one area in it (/noida/sector-62). Everything
// city-specific comes from cities.config.js; copy shared by all cities is in cityContent.js.
// Server-rendered (static at build time); only the form, the sticky bar and the tracked links
// run in the browser.
const ICONS = { id: FiShield, clock: FiClock, demo: FiGift, chat: FiMessageCircle, person: FiUser }

const eyebrow = 'text-xs font-bold uppercase tracking-[0.18em] text-sage'
const h2 = 'text-2xl font-extrabold tracking-tight text-ink sm:text-3xl'
const card = 'rounded-3xl border border-ink/10 bg-white p-6'
const btnBase = 'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border px-6 text-base font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory'
const textLink = 'font-semibold text-ink underline underline-offset-4'
const chip = active => `inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${active ? 'border-ink bg-ink text-white' : 'border-ink/15 bg-white text-ink hover:border-ink/40'}`

function AreaChips({ city, areas, current }) {
  return (
    <ul className="mt-6 flex flex-wrap gap-2">
      {areas.map(a => (
        <li key={a.slug}>
          <Link href={`/${city.slug}/${a.slug}`} aria-current={a.slug === current ? 'page' : undefined} className={chip(a.slug === current)}>
            <FiMapPin className="h-3.5 w-3.5" aria-hidden="true" /> {a.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function CityPage({ city, area = null }) {
  const place = placeName(city, area)
  const track = { city: city.name, area: area?.name }
  const whatsapp = whatsappHref(city, tutorRequestText(city, area))
  const faqs = cityFaqs(city)
  const askAboutArea = (
    <p className="mt-5 text-sm text-sage">
      Don&apos;t see your area?{' '}
      <TrackedLink href={whatsapp} target="_blank" rel="noopener noreferrer" track={{ ...track, method: 'whatsapp' }} className={textLink}>
        Message us
      </TrackedLink>{' '}
      — we&apos;re expanding.
    </p>
  )

  return (
    <div className="min-h-screen bg-ivory pb-[calc(4.75rem+env(safe-area-inset-bottom))] font-landing text-ink lg:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-lemon focus:px-4 focus:py-2 focus:font-semibold focus:text-ink focus:outline-none focus:ring-2 focus:ring-ink">
        Skip to content
      </a>
      <SiteHeader ctaHref="#city-form" />

      <main id="main">
        {/* 1. Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 md:pb-16 md:pt-10">
          <Breadcrumbs items={breadcrumbItems(city, area)} className="mb-6 md:mb-8" />
          <p className={eyebrow}><span lang="hi">{city.nameHindi}</span> · {area ? `${area.name}, ` : ''}{city.name}</p>
          <h1 className="mt-4 max-w-[18ch] text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">{heroHeading(city, area)}</h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-ink/85">
            Class 1–12 tutors who come to your home after office hours. Free demo class. Pay only if you&apos;re satisfied.
          </p>
          <p lang="hi-Latn" className="mt-3 max-w-[52ch] text-base text-sage">
            Office ke baad bachche ki padhai ki tension? Hum ghar par tutor bhejte hain.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <TrackedLink href={whatsapp} target="_blank" rel="noopener noreferrer" track={{ ...track, method: 'whatsapp' }}
              className={`${btnBase} border-ink bg-[#25D366] shadow-[0_1px_0_rgba(38,53,47,0.9)]`}>
              <FaWhatsapp className="h-5 w-5" aria-hidden="true" /> Get a Tutor on WhatsApp
            </TrackedLink>
            <a href="#city-form" className={`${btnBase} border-ink/25 bg-transparent hover:border-ink/60 hover:bg-white`}>Request a Callback</a>
          </div>
          {VERIFICATION_ENABLED && (
            <p className="mt-5 text-sm text-sage"><Link href={VERIFY_PATH} className={textLink}>How we verify tutors</Link></p>
          )}
          {city.tutorCount !== null && city.tutorCount !== undefined && (
            <p className="mt-6 text-sm font-semibold text-ink">{city.tutorCount} tutors available in {city.name}</p>
          )}
        </section>

        {/* 2. Areas we serve (city page) / this area, with nearby areas (area page) */}
        <section aria-labelledby="areas-title" className="border-y border-ink/5 bg-white/60">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
            {area ? (
              <>
                <h2 id="areas-title" className={h2}>Home tuition in {place}</h2>
                <p data-area-intro className="mt-4 max-w-[68ch] text-base leading-relaxed text-ink/85">{area.intro || city.intro}</p>
                {area.nearbyLandmarks?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold">Landmarks near {area.name}</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-ink/85">{area.nearbyLandmarks.map(l => <li key={l}>{l}</li>)}</ul>
                  </div>
                )}
                {area.schoolsNearby?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-bold">Schools near {area.name}</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-ink/85">{area.schoolsNearby.map(s => <li key={s}>{s}</li>)}</ul>
                    <p className="mt-2 text-sm text-sage">Listed to help you place us. We are not affiliated with these schools.</p>
                  </div>
                )}
                {(() => {
                  const nearby = nearbyAreasFor(city, area)
                  return (
                    <div className="mt-10">
                      <h3 className="text-xl font-bold">{nearby.heading}</h3>
                      <AreaChips city={city} areas={nearby.areas} />
                      <p className="mt-5 text-sm text-sage">
                        <Link href={`/${city.slug}`} className={textLink}>All home tutors in {city.name}</Link>
                      </p>
                      {askAboutArea}
                    </div>
                  )
                })()}
              </>
            ) : (
              <>
                <h2 id="areas-title" className={h2}>Areas we serve in {city.name}</h2>
                <p className="mt-4 max-w-[68ch] text-base leading-relaxed text-ink/85">{city.intro}</p>
                <AreaChips city={city} areas={city.areas} />
                {askAboutArea}
              </>
            )}
          </div>
        </section>

        {/* 3. Why parents choose us */}
        <section aria-labelledby="why-title" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <h2 id="why-title" className={h2}>Why parents in {city.name} choose us</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyCards(city).map(c => {
              const Icon = ICONS[c.icon]
              return (
                <li key={c.title} className={card}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint" aria-hidden="true"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/80">{c.text}</p>
                  {c.link && <p className="mt-3 text-sm"><Link href={c.link.href} className={textLink}>{c.link.label}</Link></p>}
                </li>
              )
            })}
          </ul>
        </section>

        {/* 4. How it works */}
        <section aria-labelledby="how-title" className="border-y border-ink/5 bg-white/60">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
            <h2 id="how-title" className={h2}>How it works</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {howItWorks(city).map((step, i) => (
                <li key={step.title} className={card}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lemon text-base font-bold" aria-hidden="true">{i + 1}</span>
                  <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/80">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 5. Subjects and levels */}
        <section aria-labelledby="subjects-title" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <h2 id="subjects-title" className={h2}>Subjects and levels</h2>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SUBJECTS_AND_LEVELS.map(s => (
              <div key={s.title} className={card}>
                <dt className="text-lg font-bold">{s.title}</dt>
                <dd className="mt-1 text-sm text-ink/80">{s.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 6. Verification process (only when verification is switched on) */}
        {VERIFICATION_ENABLED && (
          <section aria-labelledby="verify-title" className="border-y border-ink/5 bg-white/60">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
              <h2 id="verify-title" className={h2}>Our verification process</h2>
              <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {VERIFICATION_STEPS.map((step, i) => (
                  <li key={step.title} className={card}>
                    <p className={eyebrow}>Step {i + 1}</p>
                    <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/80">{step.text}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm"><Link href={VERIFY_PATH} className={textLink}>Read the full verification process</Link></p>
            </div>
          </section>
        )}

        {/*
          TODO(testimonials): add real parent testimonials from this city once collected, with the
          parent's permission. Never invent quotes, names, ratings or counts.
          <section aria-labelledby="testimonials-title">…</section>
        */}

        {/* 7. Lead form */}
        <section id="city-form" aria-labelledby="form-title" className="scroll-mt-20 mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
          <h2 id="form-title" className={h2}>Request a callback</h2>
          <p className="mt-3 text-base text-sage">Tell us a little and we&apos;ll call you to find the right tutor in {place}.</p>
          <div className="mt-6 rounded-[28px] border border-ink/10 bg-white p-5 sm:p-8">
            <CityLeadForm citySlug={city.slug} cityName={city.name} areas={city.areas.map(a => a.name)} defaultArea={area?.name || ''}
              homeTuitionAvailable={city.homeTuitionAvailable} whatsappDigits={whatsappDigits(city)} />
          </div>
        </section>

        {/* 8. FAQ: the answers below are exactly the text in the FAQPage JSON-LD */}
        <section aria-labelledby="faq-title" className="border-y border-ink/5 bg-white/60">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
            <h2 id="faq-title" className={h2}>Questions parents ask</h2>
            <div className="mt-6 space-y-3">
              {faqs.map(f => (
                <details key={f.q} className="group rounded-2xl border border-ink/10 bg-white">
                  <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-3 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <FiChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="px-5 pb-5 text-base leading-relaxed text-ink/85">{f.a}</p>
                  {f.link && <div className="-mt-2 px-5 pb-5 text-sm"><Link href={f.link.href} className={textLink}>{f.link.label}</Link></div>}
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Become a tutor */}
        <section aria-labelledby="teach-title" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <div className="flex flex-col items-start gap-5 rounded-3xl bg-lavender/70 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
            <h2 id="teach-title" className="max-w-[30ch] text-xl font-bold sm:text-2xl">Teaching in {city.name}? Earn alongside your studies or exam prep.</h2>
            <Link href="/become-a-tutor" className={`${btnBase} shrink-0 border-ink bg-white`}>
              Become a tutor <FiArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <JsonLd data={localBusinessJsonLd(city, area)} />
        <JsonLd data={faqJsonLd(faqs)} />
      </main>

      <SiteFooter />
      {/* 10. Sticky WhatsApp + Call bar on phones */}
      <StickyContactBar whatsappHref={whatsapp} track={track} />
    </div>
  )
}
