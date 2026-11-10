import { notFound } from 'next/navigation'
import { CITIES, getArea, getCity } from '@/features/website/cities/cities.config'
import { cityMetadata } from '@/features/website/cities/cityContent'
import CityPage from '@/features/website/cities/CityPage'

// /noida/sector-62, /delhi/dwarka, … one static page per area in cities.config.js, from the
// same template as the city page. Unknown cities or areas are a 404. Area pages without their
// own intro are noindex (see cities.config.js).
export const dynamicParams = false

export function generateStaticParams() {
  return CITIES.flatMap(city => city.areas.map(area => ({ city: city.slug, area: area.slug })))
}

export function generateMetadata({ params }) {
  const city = getCity(params.city)
  const area = getArea(city, params.area)
  return city && area ? cityMetadata(city, area) : {}
}

export default function AreaRoute({ params }) {
  const city = getCity(params.city)
  const area = getArea(city, params.area)
  if (!city || !area) notFound()
  return <CityPage city={city} area={area} />
}
