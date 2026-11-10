import { absoluteUrl } from '@/shared/lib/site'
import { CITIES } from '@/features/website/cities/cities.config'
import { isIndexable } from '@/features/website/cities/cityContent'
import { listCategories, listCourses } from '@/features/website/api/catalogueApi'

// /sitemap.xml: the homepage, city pages (and area pages that have their own intro), and the
// course catalogue. Pages kept out of search (portals, placeholders, noindex areas) are left out.
export default async function sitemap() {
  const [categories, courses] = await Promise.all([listCategories({ limit: 100 }), listCourses({ limit: 100 })])
  return [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    ...CITIES.flatMap(city => [
      { url: absoluteUrl(`/${city.slug}`), changeFrequency: 'weekly', priority: 0.9 },
      ...city.areas.filter(isIndexable).map(area => ({ url: absoluteUrl(`/${city.slug}/${area.slug}`), changeFrequency: 'monthly', priority: 0.7 })),
    ]),
    { url: absoluteUrl('/courses'), changeFrequency: 'weekly', priority: 0.7 },
    ...categories.items.map(c => ({ url: absoluteUrl(`/categories/${c.slug}`), changeFrequency: 'monthly', priority: 0.6 })),
    ...courses.items.map(c => ({ url: absoluteUrl(`/courses/${c.slug}`), changeFrequency: 'monthly', priority: 0.5 })),
  ]
}
