import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FaWhatsapp } from 'react-icons/fa'
import SiteHeader from '@/features/website/components/landing/SiteHeader'
import { SiteFooter } from '@/features/website/components/landing/Sections'
import { CITIES, getCity } from '@/features/website/cities/cities.config'
import { tutorRequestText, whatsappHref } from '@/features/website/cities/cityContent'
import TrackedLink from '@/features/website/cities/TrackedLink'
import { formatDate, getAllPosts, getPost } from '@/features/website/blog/posts'
import { BRAND_NAME } from '@/shared/brand/Logo'
import { ORGANIZATION_ID, SHARE_IMAGE_URL, pageMetadata } from '@/shared/lib/seo'
import { absoluteUrl } from '@/shared/lib/site'
import Breadcrumbs from '@/shared/ui/Breadcrumbs'
import JsonLd from '@/shared/ui/JsonLd'

// One blog post (content/blog/<slug>.md), with Article structured data and a box pointing to
// the city the post is about. Drafts render (for review) but are noindex.
export const dynamicParams = false

export function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }))
}

const SUFFIX = ` | ${BRAND_NAME}`
const pageTitle = post => (post.title.length + SUFFIX.length <= 60 ? `${post.title}${SUFFIX}` : post.title)

export function generateMetadata({ params }) {
  const post = getPost(params.slug)
  if (!post) return {}
  return pageMetadata({
    title: pageTitle(post),
    description: post.description,
    path: `/blog/${post.slug}`,
    type: 'article',
    noindex: post.draft,
    article: { publishedTime: post.date, modifiedTime: post.updated, author: post.author },
  })
}

function articleJsonLd(post) {
  const url = absoluteUrl(`/blog/${post.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: { '@type': post.authorType === 'organization' ? 'Organization' : 'Person', name: post.author },
    datePublished: post.date,
    dateModified: post.updated,
    image: [SHARE_IMAGE_URL],
    publisher: { '@type': 'Organization', '@id': ORGANIZATION_ID, name: BRAND_NAME, logo: { '@type': 'ImageObject', url: absoluteUrl('/brand/logo-mark.png') } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }
}

const btn = 'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-ink px-6 text-base font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2'

// The related-city box at the end of a post: that city's tutors, or every city.
function CityCta({ citySlug }) {
  const city = citySlug ? getCity(citySlug) : null
  if (!city) {
    return (
      <aside aria-labelledby="cta-title" className="mt-12 rounded-3xl bg-lavender/70 p-6 sm:p-8">
        <h2 id="cta-title" className="text-xl font-bold">Looking for a home tutor?</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {CITIES.map(c => <li key={c.slug}><Link href={`/${c.slug}`} className={`${btn} bg-white`}>Home tutors in {c.name}</Link></li>)}
        </ul>
      </aside>
    )
  }
  return (
    <aside aria-labelledby="cta-title" className="mt-12 rounded-3xl bg-lavender/70 p-6 sm:p-8">
      <h2 id="cta-title" className="text-xl font-bold">Looking for a home tutor in {city.name}?</h2>
      <p className="mt-2 text-ink/85">Class 1–12, evening and weekend slots, and a free demo class first.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link href={`/${city.slug}`} className={`${btn} bg-white`}>Home tutors in {city.name}</Link>
        <TrackedLink href={whatsappHref(city, tutorRequestText(city))} target="_blank" rel="noopener noreferrer"
          track={{ city: city.name, method: 'whatsapp' }} className={`${btn} bg-[#25D366]`}>
          <FaWhatsapp className="h-5 w-5" aria-hidden="true" /> Get a Tutor on WhatsApp
        </TrackedLink>
      </div>
    </aside>
  )
}

export default function BlogPostPage({ params }) {
  const post = getPost(params.slug)
  if (!post) notFound()
  return (
    <div className="min-h-screen bg-ivory font-landing text-ink">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-16">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: post.title, path: `/blog/${post.slug}` }]} />
        <article className="mt-6">
          {post.draft && <p className="mb-4 inline-block rounded-full bg-coral/60 px-3 py-1 text-sm font-semibold">Draft: not published</p>}
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
          <p className="mt-4 text-sm text-sage">
            By {post.author} · Published <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.updated !== post.date && <> · Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time></>}
          </p>
          <div className="post-body mt-8" dangerouslySetInnerHTML={{ __html: post.html }} />
        </article>
        <CityCta citySlug={post.city} />
        <JsonLd data={articleJsonLd(post)} />
      </main>
      <SiteFooter />
    </div>
  )
}
