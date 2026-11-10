import { notFound } from 'next/navigation'
import { CITIES, getCity } from '@/features/website/cities/cities.config'
import { cityMetadata } from '@/features/website/cities/cityContent'
import CityPage from '@/features/website/cities/CityPage'

// /noida, /delhi, … one static page per city in cities.config.js. Any other slug is a 404.
export const dynamicParams = false

export function generateStaticParams() {
  return CITIES.map(city => ({ city: city.slug }))
}

export function generateMetadata({ params }) {
  const city = getCity(params.city)
  return city ? cityMetadata(city) : {}
}

export default function CityRoute({ params }) {
  const city = getCity(params.city)
  if (!city) notFound()
  return <CityPage city={city} />
}
