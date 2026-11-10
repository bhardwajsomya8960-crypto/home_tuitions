import { absoluteUrl } from '@/shared/lib/site'
import { CITIES, VERIFICATION_ENABLED } from '@/features/website/cities/cities.config'
import { VERIFY_PATH, isIndexable } from '@/features/website/cities/cityContent'
import { listCategories, listCourses } from '@/features/website/api/catalogueApi'
import { getPublishedPosts } from '@/features/website/blog/posts'

// /sitemap.xml: indexable pages only, each with a last-modified date. Left out: noindex area
// pages (no unique intro yet), blog drafts, the blog index until a post is published, and
// placeholders, portals and the API. `npm run check:seo` checks the two lists agree.
export default async function sitemap() {
  const built = new Date() // pages without their own date change when the site is deployed
  const page = (path, changeFrequency, priority, lastModified = built) => ({ url: absoluteUrl(path), lastModified, changeFrequency, priority })
  const [categories, courses] = await Promise.all([listCategories({ limit: 100 }), listCourses({ limit: 100 })])
  const posts = getPublishedPosts()
  return [
    page('/', 'weekly', 1),
    ...CITIES.flatMap(city => [
      page(`/${city.slug}`, 'weekly', 0.9),
      ...city.areas.filter(area => isIndexable(area)).map(area => page(`/${city.slug}/${area.slug}`, 'monthly', 0.7)),
    ]),
    ...(VERIFICATION_ENABLED ? [page(VERIFY_PATH, 'yearly', 0.5)] : []),
    page('/courses', 'weekly', 0.7),
    ...categories.items.map(c => page(`/categories/${c.slug}`, 'monthly', 0.6)),
    ...courses.items.map(c => page(`/courses/${c.slug}`, 'monthly', 0.5)),
    ...(posts.length ? [page('/blog', 'weekly', 0.6)] : []),
    ...posts.map(post => page(`/blog/${post.slug}`, 'monthly', 0.6, new Date(`${post.updated}T00:00:00+05:30`))),
  ]
}
