import Link from 'next/link'
import SiteHeader from '@/features/website/components/landing/SiteHeader'
import { SiteFooter } from '@/features/website/components/landing/Sections'
import { CITIES } from '@/features/website/cities/cities.config'
import { formatDate, getPublishedPosts } from '@/features/website/blog/posts'
import { pageMetadata } from '@/shared/lib/seo'
import Breadcrumbs from '@/shared/ui/Breadcrumbs'

// The blog index: published posts only (drafts are left out). Until the first post is
// published the page is noindex and not in the sitemap, so an empty page is never indexed.
export function generateMetadata() {
  return pageMetadata({
    title: 'Blog | Home & Online Tutor Hub',
    description: 'Guides for parents in Noida and Delhi NCR on home tuition, choosing a tutor and studying at home.',
    path: '/blog',
    noindex: getPublishedPosts().length === 0,
  })
}

export default function BlogIndexPage() {
  const posts = getPublishedPosts()
  return (
    <div className="min-h-screen bg-ivory font-landing text-ink">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-16">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }]} />
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">Blog</h1>
        {posts.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-ink/25 bg-white p-8">
            <p className="text-lg">Our first articles for parents are on the way.</p>
            <p className="mt-3 text-sage">
              Meanwhile, find a home tutor in{' '}
              {CITIES.map((city, i) => (
                <span key={city.slug}>{i > 0 && ' or '}<Link href={`/${city.slug}`} className="font-semibold text-ink underline underline-offset-4">{city.name}</Link></span>
              ))}.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {posts.map(post => (
              <li key={post.slug} className="rounded-3xl border border-ink/10 bg-white p-6">
                <h2 className="text-xl font-bold"><Link href={`/blog/${post.slug}`} className="hover:underline underline-offset-4">{post.title}</Link></h2>
                <p className="mt-2 text-ink/80">{post.description}</p>
                <p className="mt-3 text-sm text-sage">{post.author} · <time dateTime={post.date}>{formatDate(post.date)}</time></p>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
