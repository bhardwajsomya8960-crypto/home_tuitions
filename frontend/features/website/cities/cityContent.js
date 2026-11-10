// Copy and structured data for the city pages, built from a city (and optional area) in
// cities.config.js. One source for what is shown and what search engines read (the FAQ
// accordion and its FAQPage JSON-LD come from the same list).
import { BRAND_NAME } from '@/shared/brand/Logo'
import { absoluteUrl } from '@/shared/lib/site'
import { DEFAULT_WHATSAPP, VERIFICATION_ENABLED } from './cities.config'

export const placeName = (city, area) => (area ? `${area.name}, ${city.name}` : city.name)
export const cityPath = (city, area) => (area ? `/${city.slug}/${area.slug}` : `/${city.slug}`)
const tutorKind = city => (city.homeTuitionAvailable ? 'Home Tutors' : 'Online Tutors')

// An area page is indexed only once it has its own intro (see cities.config.js).
export const isIndexable = area => !area || Boolean(area.intro)

export const heroHeading = (city, area) => `${VERIFICATION_ENABLED ? 'Verified ' : ''}${tutorKind(city)} in ${placeName(city, area)}`

export const whatsappDigits = city => (city.whatsappNumber || DEFAULT_WHATSAPP).replace(/\D/g, '')
export const whatsappHref = (city, text) => `https://wa.me/${whatsappDigits(city)}?text=${encodeURIComponent(text)}`
export const tutorRequestText = (city, area) =>
  `Hi, I need ${city.homeTuitionAvailable ? 'a home tutor' : 'an online tutor'} in ${city.name}. Class: __, Subject: __, Area: ${area ? area.name : '__'}`

export function whyCards(city) {
  return [
    VERIFICATION_ENABLED && {
      icon: 'id',
      title: 'ID and qualification checked tutors',
      text: 'We check every tutor’s government ID and qualifications, and meet them in an interview or demo, before they teach your child.',
    },
    {
      icon: 'clock',
      title: 'Evening and weekend slots',
      text: `Classes fit around office hours: weekday evenings after you are home, weekends, or both. Tell us what works in your part of ${city.name}.`,
    },
    {
      icon: 'demo',
      title: 'Free demo class before you pay',
      text: 'Meet the tutor and see a class first. You decide after the demo.',
    },
    {
      icon: 'chat',
      title: 'Monthly progress update on WhatsApp',
      text: 'A short note each month on what was covered and where your child needs more practice.',
    },
    {
      icon: 'person',
      title: 'Female tutor on request',
      text: 'Prefer a female tutor? Tick the box in the form and we will look for one near you.',
    },
  ].filter(Boolean)
}

export const howItWorks = city => [
  { title: 'Tell us your need', text: `Class, subjects, your area in ${city.name} and the times that suit you. It takes a minute on WhatsApp or the form below.` },
  { title: 'We share matched tutors within 24 hours', text: 'We call you with tutors who can reach your area and fit your timings.' },
  { title: 'Free demo, then start', text: 'Take a free demo class. Start regular classes only if you are happy with the tutor.' },
]

export const SUBJECTS_AND_LEVELS = [
  { title: 'Class 1–5', text: 'All subjects' },
  { title: 'Class 6–10', text: 'Maths, Science, English' },
  { title: 'Class 11–12', text: 'PCM, PCB, Commerce' },
  { title: 'Board exam preparation', text: 'Class 10 and Class 12' },
  { title: 'Spoken English', text: 'For school students and adults' },
  { title: 'Computer / Coding', text: 'School computer science and beginner programming' },
]

// Plain steps only: no badges or certifications we do not have.
export const VERIFICATION_STEPS = [
  { title: 'Government ID check', text: 'We check a government-issued photo ID for every tutor.' },
  { title: 'Qualification check', text: 'We check their degree or marksheets for the subjects they will teach.' },
  { title: 'Interview or demo', text: 'Each tutor takes an interview or a demo class with our team first.' },
  { title: 'Parent feedback after the first month', text: 'We ask how it is going after the first month, and act on what you tell us.' },
]

export function cityFaqs(city) {
  return [
    {
      q: `How much does home tuition cost in ${city.name}?`,
      // TODO(fees): add typical fee ranges for this city once confirmed. No rupee figures until then.
      a: 'Fees depend on class, subject and hours. We’ll share options on call — no charge for matching.',
    },
    { q: 'Is the demo class really free?', a: 'Yes. The first demo class is free, and you decide after it whether to continue.' },
    VERIFICATION_ENABLED && {
      q: 'How are tutors verified?',
      a: 'We check each tutor’s government ID and qualifications, they take an interview or a demo class with our team, and we ask for your feedback after the first month.',
    },
    {
      q: 'Can I change the tutor?',
      // TODO(re-match policy): confirm the tutor change policy before relying on this answer.
      a: 'Yes, we’ll re-match you at no extra cost.',
    },
    { q: `Do you offer online tuition outside ${city.name}?`, a: 'Yes. Online tuition is available across India.' },
  ].filter(Boolean)
}

// Search result title and description. The config's seo text may say "Verified"; with
// verification switched off, neutral defaults are used so no claim leaks into search results.
export function seoFor(city, area) {
  const place = placeName(city, area)
  const fallback = {
    title: `${tutorKind(city)} in ${place} | Free Demo | ${BRAND_NAME}`,
    description: `${city.homeTuitionAvailable ? 'Home' : 'Online'} tutors for Class 1 to 12 in ${place}. Evening and weekend classes after office hours, with a free demo class first.`,
  }
  if (!VERIFICATION_ENABLED) return fallback
  if (area) return { ...fallback, title: `${tutorKind(city)} in ${place} | Verified, Free Demo | ${BRAND_NAME}` }
  return { ...fallback, ...city.seo }
}

export function cityMetadata(city, area) {
  const { title, description } = seoFor(city, area)
  const path = cityPath(city, area)
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: BRAND_NAME, locale: 'en_IN', type: 'website' },
    ...(isIndexable(area) ? {} : { robots: { index: false, follow: true } }),
  }
}

export function organizationJsonLd(city, area) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: BRAND_NAME,
    url: absoluteUrl(cityPath(city, area)),
    telephone: `+${whatsappDigits(city)}`,
    description: seoFor(city, area).description,
    areaServed: [
      { '@type': 'City', name: city.name },
      ...(area ? [area] : city.areas).map(a => ({ '@type': 'Place', name: `${a.name}, ${city.name}` })),
    ],
  }
}

export function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
}
