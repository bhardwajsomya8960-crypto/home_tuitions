import Link from 'next/link'
import { FaWhatsapp } from 'react-icons/fa'
import { FiArrowRight, FiCheck, FiChevronDown, FiClock, FiGift, FiMapPin, FiMessageCircle, FiShield, FiUser } from 'react-icons/fi'
import SiteHeader from '@/features/website/components/landing/SiteHeader'
import { SiteFooter } from '@/features/website/components/landing/Sections'
import { StudyCornerInline } from '@/features/website/components/StudyCorner'
import Breadcrumbs from '@/shared/ui/Breadcrumbs'
import JsonLd from '@/shared/ui/JsonLd'
import { CITIES, VERIFICATION_ENABLED } from './cities.config'
import {
  EVENING_PLAN, HERO_POINTS, SUBJECTS_AND_LEVELS, VERIFICATION_STEPS, VERIFY_PATH, breadcrumbItems, cityFaqs, faqJsonLd,
  heroHeading, howItWorks, localBusinessJsonLd, nearMeBreadcrumbs, nearMeFaqs, nearMeHeading, nearMeRequestText,
  nearbyAreasFor, placeName, tutorRequestText, whatsappDigits, whatsappHref, whyCards,
} from './cityContent'
import CityLeadForm from './CityLeadForm'
import StickyContactBar from './StickyContactBar'
import TrackedLink from './TrackedLink'

// The landing page for one city (/noida), one area in it (/noida/sector-62), or the visitor's
// own city (/tutors-near-me, where `city` has no slug: see nearMeCity in cityContent.js).
// Everything city-specific comes from cities.config.js; copy is in cityContent.js.
// Server-rendered; only the form, the phone bar and the tracked links run in the browser.
//
// Layout, mobile first: one primary action (WhatsApp) in the hero with the promises beside it,
// then short sections (benefit list, a 1-2-3 timeline, compact subject tiles, one verification
// panel) so the form arrives early on a phone. The phone bar appears once the hero button has
// scrolled away. Desktop spreads the same content into columns.
const ICONS = { id: FiShield, clock: FiClock, demo: FiGift, chat: FiMessageCircle, person: FiUser }

const wrap = 'mx-auto max-w-6xl px-4 sm:px-6'
const band = 'border-y border-ink/5 bg-white/60'
const h2 = 'text-[1.6rem] font-extrabold leading-tight tracking-tight text-ink [text-wrap:balance] sm:text-3xl'
const textLink = 'font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink'
const primaryBtn = 'inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full border border-ink bg-[#25D366] px-7 text-base font-semibold text-ink shadow-[0_2px_0_rgba(38,53,47,0.9)] transition-transform duration-150 motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory sm:w-auto'
const chip = active => `inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${active ? 'border-ink bg-ink text-white' : 'border-ink/15 bg-white text-ink hover:border-ink/40'}`

function AreaChips({ city, areas, current }) {
  return (
    <ul className="-mx-4 mt-5 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden" aria-label="Areas">
      {areas.map(a => (
        <li key={a.slug} className="shrink-0 snap-start">
          <Link href={`/${city.slug}/${a.slug}`} aria-current={a.slug === current ? 'page' : undefined} className={chip(a.slug === current)}>
            <FiMapPin className="h-3.5 w-3.5" aria-hidden="true" /> {a.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

// The hero illustration: the two students at their desk, captioned with a weekday evening.
function HeroVisual() {
  return (
    <figure className="flex items-center gap-3 overflow-hidden rounded-[1.75rem] border border-ink/10 bg-mint/45 p-3.5 sm:block sm:rounded-[2rem] sm:px-7 sm:pb-5 sm:pt-6">
      {/* Phones: the scene at 65% beside the timeline. Larger screens: full size above it. */}
      <div className="h-[104px] w-[156px] shrink-0 sm:flex sm:h-auto sm:w-auto sm:justify-center">
        <StudyCornerInline className="origin-top-left scale-[0.65] sm:scale-100 lg:origin-bottom lg:scale-[1.2]" />
      </div>
      <figcaption className="min-w-0 flex-1 sm:mt-4 sm:rounded-2xl sm:bg-white/85 sm:p-4">
        <p className="text-[13px] font-semibold leading-snug text-ink sm:text-sm">A weekday with a home tutor</p>
        <ol className="mt-2 space-y-1 sm:mt-3 sm:space-y-2">
          {EVENING_PLAN.map(step => (
            <li key={step.time} className="flex flex-wrap items-baseline gap-x-2 text-[13px] leading-snug sm:flex-nowrap sm:gap-3 sm:text-sm">
              <span className="font-bold tabular-nums text-ink sm:w-16 sm:shrink-0">{step.time}</span>
              <span className="text-ink/75">{step.text}</span>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  )
}

export default function CityPage({ city, area = null }) {
  const nearMe = !city.slug
  const place = nearMe ? city.name : placeName(city, area)
  const track = { city: city.name || 'near me', area: area?.name }
  const whatsapp = whatsappHref(city, nearMe ? nearMeRequestText(city.name) : tutorRequestText(city, area))
  const faqs = nearMe ? nearMeFaqs(city.name) : cityFaqs(city)
  const crumbs = nearMe ? nearMeBreadcrumbs() : breadcrumbItems(city, area)
  const cityLabel = city.name || 'your city'
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
        {/* 1. Hero: heading, the three promises, one primary action; the illustration beside it on desktop. */}
        <section className={`${wrap} pb-8 pt-4 sm:pt-6 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14 lg:pb-16 lg:pt-10`}>
          <div>
            <Breadcrumbs items={crumbs} className="text-xs sm:text-sm" />
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-lavender/70 px-3 py-1.5 text-sm font-semibold text-ink">
              <FiMapPin className="h-4 w-4" aria-hidden="true" />
              {nearMe ? (city.name || 'Near you') : <>{area ? `${area.name}, ` : ''}{city.name}</>}
              {city.nameHindi && <span lang="hi" className="font-medium text-ink/70">{city.nameHindi}</span>}
            </p>
            <h1 className="mt-4 max-w-[17ch] text-[2.15rem] font-extrabold leading-[1.06] tracking-tight [text-wrap:balance] sm:text-5xl lg:text-[3.4rem]">
              {nearMe ? nearMeHeading(city.name) : heroHeading(city, area)}
            </h1>
            <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-ink/80 sm:text-lg">
              {nearMe
                ? 'Class 1–12 tutors for your child. We send a home tutor where we have one near you, and teach live online everywhere else.'
                : 'Class 1–12 tutors who come to your home after office hours.'}
            </p>
            <ul className="mt-5 space-y-2">
              {HERO_POINTS.map(point => (
                <li key={point} className="flex items-center gap-2.5 text-[15px] font-medium text-ink">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lemon" aria-hidden="true"><FiCheck className="h-3.5 w-3.5" /></span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <TrackedLink id="hero-cta" href={whatsapp} target="_blank" rel="noopener noreferrer" track={{ ...track, method: 'whatsapp' }} className={primaryBtn}>
                <FaWhatsapp className="h-5 w-5" aria-hidden="true" /> Get a tutor on WhatsApp
              </TrackedLink>
              <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <a href="#city-form" className={textLink}>Request a callback instead</a>
                {VERIFICATION_ENABLED && <Link href={VERIFY_PATH} className={textLink}>How we verify tutors</Link>}
              </p>
            </div>
            <p lang="hi-Latn" className="mt-6 max-w-[46ch] border-l-4 border-lemon pl-3 text-sm leading-relaxed text-sage">
              Office ke baad bachche ki padhai ki tension? Hum ghar par tutor bhejte hain.
            </p>
            {city.tutorCount !== null && city.tutorCount !== undefined && (
              <p className="mt-5 text-sm font-semibold text-ink">{city.tutorCount} tutors available in {city.name}</p>
            )}
          </div>
          <div className="mt-10 lg:mt-0">
            <HeroVisual />
          </div>
        </section>

        {/* 2. Where we teach: the city's areas, this area with its neighbours, or (near-me) our cities. */}
        <section aria-labelledby="areas-title" className={band}>
          <div className={`${wrap} py-8 md:py-16`}>
            {nearMe ? (
              <>
                <h2 id="areas-title" className={h2}>Where we teach</h2>
                <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-ink/85">
                  Home tuition today in Noida and Delhi, and live online classes across India.
                  {city.name ? ` In ${city.name}? ` : ' '}Tell us your area in the form below and we&apos;ll check whether a home tutor can reach you.
                  If not, your child can learn live online with a tutor instead.
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {CITIES.map(c => (
                    <li key={c.slug}><Link href={`/${c.slug}`} className={chip(false)}><FiMapPin className="h-3.5 w-3.5" aria-hidden="true" /> Home tutors in {c.name}</Link></li>
                  ))}
                </ul>
              </>
            ) : area ? (
              <>
                <h2 id="areas-title" className={h2}>Home tuition in {place}</h2>
                <p data-area-intro className="mt-4 max-w-[65ch] text-base leading-relaxed text-ink/85">{area.intro || city.intro}</p>
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
                    <div className="mt-8">
                      <h3 className="text-lg font-bold">{nearby.heading}</h3>
                      <AreaChips city={city} areas={nearby.areas} />
                      <p className="mt-5 text-sm"><Link href={`/${city.slug}`} className={textLink}>All home tutors in {city.name}</Link></p>
                      {askAboutArea}
                    </div>
                  )
                })()}
              </>
            ) : (
              <>
                <h2 id="areas-title" className={h2}>Areas we serve in {city.name}</h2>
                <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-ink/85">{city.intro}</p>
                <AreaChips city={city} areas={city.areas} />
                {askAboutArea}
              </>
            )}
          </div>
        </section>

        {/* 3. Why parents choose us: a benefit list, not a wall of cards. */}
        <section aria-labelledby="why-title" className={`${wrap} py-8 md:py-16`}>
          <h2 id="why-title" className={h2}>Why parents {city.name ? `in ${city.name} ` : ''}choose us</h2>
          {/* Phones: a row of cards to swipe (the next one peeks in). From sm up: a list in columns. */}
          <ul className="-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
            {whyCards(city).map(c => {
              const Icon = ICONS[c.icon]
              return (
                <li key={c.title} className="w-[78%] shrink-0 snap-start rounded-3xl border border-ink/10 bg-white p-5 sm:flex sm:w-auto sm:gap-4 sm:border-0 sm:bg-transparent sm:p-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mint" aria-hidden="true"><Icon className="h-5 w-5" /></span>
                  <div className="mt-3 sm:mt-0">
                    <h3 className="text-base font-bold leading-snug">{c.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/75">{c.text}</p>
                    {c.link && <p className="mt-2 text-sm"><Link href={c.link.href} className={textLink}>{c.link.label}</Link></p>}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        {/* 4. How it works: a real sequence, so numbered and joined by a line on phones. */}
        <section aria-labelledby="how-title" className={band}>
          <div className={`${wrap} py-8 md:py-16`}>
            <h2 id="how-title" className={h2}>How it works</h2>
            <ol className="mt-7 space-y-6 md:grid md:grid-cols-3 md:gap-8 md:space-y-0">
              {howItWorks(city).map((step, i) => (
                <li key={step.title} className="relative flex gap-4 before:absolute before:-bottom-6 before:left-5 before:top-11 before:w-px before:bg-ink/15 last:before:hidden md:block md:before:hidden">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink bg-lemon text-base font-bold" aria-hidden="true">{i + 1}</span>
                  <div className="md:mt-4">
                    <h3 className="text-base font-bold leading-snug sm:text-lg">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/75">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 5. Subjects and levels: compact tiles, two per row on phones. */}
        <section aria-labelledby="subjects-title" className={`${wrap} py-8 md:py-16`}>
          <h2 id="subjects-title" className={h2}>Subjects and levels</h2>
          <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3 lg:grid-cols-3">
            {SUBJECTS_AND_LEVELS.map(s => (
              <div key={s.title} className="rounded-2xl border border-ink/10 bg-white p-3.5 sm:p-4">
                <dt className="text-[15px] font-bold leading-snug">{s.title}</dt>
                <dd className="mt-1 text-sm leading-snug text-ink/70">{s.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 6. Verification process (only when verification is switched on): one panel. */}
        {VERIFICATION_ENABLED && (
          <section aria-labelledby="verify-title" className={band}>
            <div className={`${wrap} py-8 md:py-16`}>
              <div className="rounded-[2rem] bg-lavender/60 p-5 sm:p-8">
                <h2 id="verify-title" className={h2}>Our verification process</h2>
                <ol className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                  {VERIFICATION_STEPS.map((step, i) => (
                    <li key={step.title} className="flex items-center gap-3 sm:items-start lg:block">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold" aria-hidden="true">{i + 1}</span>
                      <div className="lg:mt-3">
                        <h3 className="text-base font-bold leading-snug">{step.title}</h3>
                        <p className="mt-1 hidden text-sm leading-relaxed text-ink/75 sm:block">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 text-sm"><Link href={VERIFY_PATH} className={textLink}>Read the full verification process</Link></p>
              </div>
            </div>
          </section>
        )}

        {/*
          TODO(testimonials): add real parent testimonials from this city once collected, with the
          parent's permission. Never invent quotes, names, ratings or counts.
          <section aria-labelledby="testimonials-title">…</section>
        */}

        {/* 7. Lead form */}
        <section id="city-form" aria-labelledby="form-title" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-10 sm:px-6 md:py-16">
          <h2 id="form-title" className={h2}>Request a callback</h2>
          <p className="mt-3 text-base text-ink/75">Tell us a little and we&apos;ll call you to find the right tutor {place ? `in ${place}` : 'near you'}.</p>
          <div className="mt-6 rounded-[1.75rem] border border-ink/10 bg-white p-5 shadow-[0_1px_0_rgba(38,53,47,0.06)] sm:p-8">
            <CityLeadForm citySlug={city.slug} cityName={city.name} areas={city.areas.map(a => a.name)} defaultArea={area?.name || ''}
              homeTuitionAvailable={city.homeTuitionAvailable} whatsappDigits={whatsappDigits(city)} />
          </div>
        </section>

        {/* 8. FAQ: the answers below are exactly the text in the FAQPage JSON-LD */}
        <section aria-labelledby="faq-title" className={band}>
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-16">
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

        {/* 9. Closing call to action: the same promise and action as the hero. */}
        <section aria-labelledby="final-title" className={`${wrap} pt-8 md:pt-16`}>
          <div className="flex flex-col gap-5 rounded-[2rem] border border-ink bg-lemon p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="final-title" className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">Start with a free demo class</h2>
              <p className="mt-2 text-base text-ink/80">Message us the class and subject. We&apos;ll share tutors {place ? `for ${place}` : 'near you'} within 24 hours.</p>
            </div>
            <TrackedLink href={whatsapp} target="_blank" rel="noopener noreferrer" track={{ ...track, method: 'whatsapp' }} className={`${primaryBtn} shrink-0`}>
              <FaWhatsapp className="h-5 w-5" aria-hidden="true" /> Get a tutor on WhatsApp
            </TrackedLink>
          </div>
        </section>

        {/* 10. Become a tutor */}
        <section aria-labelledby="teach-title" className={`${wrap} py-8 md:py-16`}>
          <div className="flex flex-col items-start gap-4 rounded-[2rem] border border-ink/10 bg-white p-5 sm:p-8 md:flex-row md:items-center md:justify-between">
            <h2 id="teach-title" className="max-w-[32ch] text-lg font-bold leading-snug sm:text-xl">Teaching in {cityLabel}? Earn alongside your studies or exam prep.</h2>
            <Link href="/become-a-tutor" className="inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-full border border-ink bg-white px-5 font-semibold text-ink hover:bg-sand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink">
              Become a tutor <FiArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {!nearMe && <JsonLd data={localBusinessJsonLd(city, area)} />}
        <JsonLd data={faqJsonLd(faqs)} />
      </main>

      <SiteFooter />
      {/* Phone bar: WhatsApp + Call once the hero button has scrolled away */}
      <StickyContactBar whatsappHref={whatsapp} track={track} />
    </div>
  )
}
