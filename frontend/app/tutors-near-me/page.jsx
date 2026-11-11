import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import CityPage from '@/features/website/cities/CityPage'
import { nearMeCity, nearMeMetadata } from '@/features/website/cities/cityContent'
import { cityPageFor, visitorCity } from '@/features/website/cities/nearMe'

// /tutors-near-me: the ad landing page that greets each visitor with their own city
// ("Verified tutors in Lucknow, at home or online"). The city comes from ?city= or the
// visitor's location (features/website/cities/nearMe.js); visitors from Noida or Delhi are
// sent to those pages. Rendered per request, and noindex since its text depends on the visitor.
export const dynamic = 'force-dynamic'

export function generateMetadata({ searchParams }) {
  return nearMeMetadata(visitorCity(searchParams, headers()))
}

export default function TutorsNearMePage({ searchParams }) {
  const name = visitorCity(searchParams, headers())
  const cityPage = cityPageFor(name, searchParams)
  if (cityPage) redirect(cityPage)
  return <CityPage city={nearMeCity(name)} />
}
