// Copy, metadata and structured data for the city pages, built from a city (and optional area)
// in cities.config.js. One source for what is shown and what search engines read: the FAQ
// accordion and its FAQPage JSON-LD, and the visible breadcrumbs and BreadcrumbList, come
// from the same lists, so they always match.
import { BRAND_NAME } from '@/shared/brand/Logo'
import { absoluteUrl } from '@/shared/lib/site'
import { ORGANIZATION_ID, pageMetadata } from '@/shared/lib/seo'
import { CONTACT, SOCIAL_PROFILES } from '@/features/website/contact'
import { DEFAULT_WHATSAPP, VERIFICATION_ENABLED } from './cities.config'

export const VERIFY_PATH = '/how-we-verify'

export const placeName = (city, area) => (area ? `${area.name}, ${city.name}` : city.name)
export const cityPath = (city, area) => (area ? `/${city.slug}/${area.slug}` : `/${city.slug}`)
const tutorKind = city => (city.homeTuitionAvailable ? 'Home Tutors' : 'Online Tutors')

// How people search for an area: "Noida Sector 62", "Noida Extension", "Dwarka, Delhi".
export function areaSearchName(city, area) {
  const name = area.shortName || area.name
  if (name.toLowerCase().includes(city.name.toLowerCase())) return name
  return /^sector\b/i.test(name) ? `${city.name} ${name}` : `${name}, ${city.name}`
}

export const wordCount = text => (text || '').trim().split(/\s+/).filter(Boolean).length

// An area page is indexed only when it is marked indexable AND has its own 80–150 word intro;
// otherwise it is noindex and kept out of the sitemap (see cities.config.js).
export const isIndexable = area => !area || (area.indexable === true && wordCount(area.intro) >= 80 && wordCount(area.intro) <= 150)

export const heroHeading = (city, area) => `${VERIFICATION_ENABLED ? 'Verified ' : ''}${tutorKind(city)} in ${placeName(city, area)}`

export const whatsappDigits = city => (city.whatsappNumber || DEFAULT_WHATSAPP).replace(/\D/g, '')
export const whatsappHref = (city, text) => `https://wa.me/${whatsappDigits(city)}?text=${encodeURIComponent(text)}`
export const tutorRequestText = (city, area) =>
  `Hi, I need ${city.homeTuitionAvailable ? 'a home tutor' : 'an online tutor'} in ${city.name}. Class: __, Subject: __, Area: ${area ? area.name : '__'}`

// Neighbouring areas for the "Nearby areas we also cover" block. Until nearbyAreas is filled
// in, the block lists the city's other areas under a heading that says so.
export function nearbyAreasFor(city, area) {
  const nearby = (area.nearbyAreas || []).map(slug => city.areas.find(a => a.slug === slug)).filter(Boolean)
  return nearby.length
    ? { heading: 'Nearby areas we also cover', areas: nearby }
    : { heading: `Other areas we cover in ${city.name}`, areas: city.areas.filter(a => a.slug !== area.slug) }
}

export const breadcrumbItems = (city, area) => [
  { name: 'Home', path: '/' },
  { name: city.name, path: `/${city.slug}` },
  ...(area ? [{ name: area.name, path: cityPath(city, area) }] : []),
]

export function whyCards(city) {
  return [
    VERIFICATION_ENABLED && {
      icon: 'id',
      title: 'ID and qualification checked tutors',
      text: 'We check every tutor’s government ID and qualifications, and meet them in an interview or demo, before they teach your child.',
      link: { href: VERIFY_PATH, label: 'How we verify tutors' },
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

// Plain steps only: no badges or certifications we do not have. Also used by /how-we-verify.
export const VERIFICATION_STEPS = [
  { title: 'Government ID check', text: 'We check a government-issued photo ID for every tutor.' },
  { title: 'Qualification check', text: 'We check their degree or marksheets for the subjects they will teach.' },
  { title: 'Interview or demo', text: 'Each tutor takes an interview or a demo class with our team first.' },
  { title: 'Parent feedback after the first month', text: 'We ask how it is going after the first month, and act on what you tell us.' },
]

// `a` is the answer exactly as shown and as sent in the FAQPage JSON-LD. `link` is shown
// after the answer only (not part of the answer text).
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
      link: { href: VERIFY_PATH, label: 'Read how we verify tutors' },
    },
    {
      q: 'Can I change the tutor?',
      // TODO(re-match policy): confirm the tutor change policy before relying on this answer.
      a: 'Yes, we’ll re-match you at no extra cost.',
    },
    { q: `Do you offer online tuition outside ${city.name}?`, a: 'Yes. Online tuition is available across India.' },
  ].filter(Boolean)
}

// Search result title (max 60 characters) and description (max 155), unique per page.
export function seoFor(city, area) {
  const kind = city.homeTuitionAvailable ? 'Home' : 'Online'
  if (area) {
    const where = areaSearchName(city, area)
    return {
      title: area.seoTitle || `${kind} Tutor in ${where} | Free Demo`,
      description: area.seoDescription || `${kind} tutors in ${where} for Class 1–12, after office hours. Evening and weekend slots, and a free demo class before you pay.`,
    }
  }
  const fallback = {
    title: `${kind} Tutors in ${city.name} | Free Demo Class`,
    description: `${kind} tutors for Class 1–12 in ${city.name}. Evening and weekend classes after office hours, with a free demo class first.`,
  }
  const seo = { ...fallback, ...city.seo }
  // A configured title or description must not keep a verification claim once it is switched off.
  return !VERIFICATION_ENABLED && /verif/i.test(`${seo.title} ${seo.description}`) ? fallback : seo
}

export function cityMetadata(city, area) {
  return pageMetadata({ ...seoFor(city, area), path: cityPath(city, area), noindex: !isIndexable(area) })
}

// The business as it serves this city (or area). No address unless the city has a public one,
// and no ratings until real review data is wired in.
export function localBusinessJsonLd(city, area) {
  const place = name => ({ '@type': 'Place', name })
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'EducationalOrganization'],
    '@id': absoluteUrl(`${cityPath(city, area)}#business`),
    name: BRAND_NAME,
    url: absoluteUrl(cityPath(city, area)),
    telephone: CONTACT.phoneE164,
    description: seoFor(city, area).description,
    areaServed: area
      ? [place(`${area.name}, ${city.name}`), place(city.name)]
      : [place(city.name), ...city.areas.map(a => place(`${a.name}, ${city.name}`))],
    parentOrganization: { '@id': ORGANIZATION_ID },
    ...(SOCIAL_PROFILES.length ? { sameAs: SOCIAL_PROFILES } : {}),
    ...(city.address ? { address: { '@type': 'PostalAddress', ...city.address } } : {}),
  }
}

export function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
}
