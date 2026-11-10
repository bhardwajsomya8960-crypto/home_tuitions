import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/features/website/components/landing/SiteHeader'
import { SiteFooter } from '@/features/website/components/landing/Sections'
import CourseCard from '@/features/website/components/catalogue/CourseCard'
import CatalogueUnavailable from '@/features/website/components/catalogue/CatalogueUnavailable'
import { CatalogueUnavailableError, getCategory, listCategories } from '@/features/website/api/catalogueApi'
import { pageMetadata } from '@/shared/lib/seo'

// Built at deploy time from the website's catalogue data.
export async function generateStaticParams() {
  const { items } = await listCategories({ limit: 100 })
  return items.map(category => ({ slug: category.slug }))
}

async function load(slug) {
  try {
    return { category: await getCategory(slug) }
  } catch (err) {
    if (err instanceof CatalogueUnavailableError) return { failed: true }
    throw err
  }
}

export async function generateMetadata({ params }) {
  const { category, failed } = await load(params.slug)
  if (failed) return { title: 'Category | Home & Online Tutor Hub' }
  if (!category) return { title: 'Category not found | Home & Online Tutor Hub' }
  return pageMetadata({
    title: category.seoTitle || `${category.name} | Home & Online Tutor Hub`,
    description: category.seoDescription || category.shortDescription || undefined,
    path: `/categories/${category.slug}`,
  })
}

export default async function CategoryPage({ params }) {
  const { category, failed } = await load(params.slug)
  if (failed) {
    return (
      <Shell>
        <CatalogueUnavailable retryHref={`/categories/${params.slug}`} message="We could not load this category right now." />
      </Shell>
    )
  }
  if (!category) notFound()

  return (
    <Shell>
      <nav aria-label="Breadcrumb" className="text-sm text-sage">
        <Link href="/courses" className="underline underline-offset-4 hover:text-ink">Courses</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-ink">{category.name}</span>
      </nav>
      <header className="mt-5">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{category.name}</h1>
        {category.shortDescription && <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink/85">{category.shortDescription}</p>}
        {category.description && <p className="mt-4 max-w-[70ch] whitespace-pre-line text-base leading-relaxed text-ink/80">{category.description}</p>}
      </header>

      <section aria-labelledby="category-courses" className="mt-10">
        <h2 id="category-courses" className="text-xl font-bold">Courses in {category.name}</h2>
        {category.courses.length === 0 ? (
          <p className="mt-4 rounded-3xl border border-dashed border-ink/25 bg-white p-8 text-center text-sage">
            Courses for this category are being added. <Link href="/courses" className="underline underline-offset-4 text-ink">Browse all courses</Link>.
          </p>
        ) : (
          <ul className="mt-5 grid gap-5 sm:grid-cols-2">
            {category.courses.map(course => <CourseCard key={course.id} course={course} />)}
          </ul>
        )}
      </section>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-ivory font-landing text-ink">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">{children}</main>
      <SiteFooter />
    </div>
  )
}
