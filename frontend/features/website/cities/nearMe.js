import { findCityByName } from './cities.config'

// Works out the visitor's city for /tutors-near-me, in this order:
//   1. ?city=Gurugram in the link (for ads aimed at one city; also handy for testing)
//   2. the city Vercel reports for the visitor's connection (x-vercel-ip-city), in India only
// IP locations are approximate (mobile networks often report a nearby hub city), so the
// page never depends on it being right. Nothing is stored.
export function cleanCityName(raw) {
  if (typeof raw !== 'string') return ''
  let name = raw
  try { name = decodeURIComponent(raw) } catch { /* keep as is */ }
  name = name.replace(/[^\p{L} .'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 30)
  if (name.length < 2) return ''
  return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function visitorCity(searchParams, requestHeaders) {
  const fromLink = cleanCityName(searchParams?.city)
  if (fromLink) return fromLink
  const inIndia = requestHeaders.get('x-vercel-ip-country') === 'IN'
  return inIndia ? cleanCityName(requestHeaders.get('x-vercel-ip-city') || '') : ''
}

// A visitor from a city with its own page (Noida, Delhi / New Delhi) goes there instead,
// keeping the ad's UTM parameters. Returns the address, or null to stay on this page.
export function cityPageFor(name, searchParams) {
  const city = findCityByName(name)
  if (!city) return null
  const keep = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams || {})) if (key !== 'city' && typeof value === 'string') keep.set(key, value)
  const query = keep.toString()
  return `/${city.slug}${query ? `?${query}` : ''}`
}
