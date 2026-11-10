import Link from 'next/link'
import SiteHeader from '@/features/website/components/landing/SiteHeader'
import { SiteFooter } from '@/features/website/components/landing/Sections'
import CourseCard from '@/features/website/components/catalogue/CourseCard'
import CatalogueUnavailable from '@/features/website/components/catalogue/CatalogueUnavailable'
import { CatalogueUnavailableError, listCategories, listCourses } from '@/features/website/api/catalogueApi'
import { pageMetadata } from '@/shared/lib/seo'

export const metadata = pageMetadata({
  title: 'Courses | Home & Online Tutor Hub',
  description: 'Browse school, competitive exam, college and computer courses for home and online tuition.',
  path: '/courses',
})

export const revalidate = 60

const MODE_OPTIONS = [
  { value: '', label: 'Home or online' },
  { value: 'home', label: 'Home' },
  { value: 'online', label: 'Online' },
]

function buildHref(current, overrides) {
  const params = new URLSearchParams()
  const merged = { ...current, ...overrides }
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v))
  }
  const query = params.toString()
  return query ? `/courses?${query}` : '/courses'
}

export default async function CoursesPage({ searchParams }) {
  const filters = {
    q: typeof searchParams.q === 'string' ? searchParams.q.trim().slice(0, 100) : '',
    category: typeof searchParams.category === 'string' ? searchParams.category : '',
    mode: ['home', 'online'].includes(searchParams.mode) ? searchParams.mode : '',
  }
  const page = Math.max(parseInt(searchParams.page, 10) || 1, 1)
  const limit = 12

  let categories = []
  let courses = null
  let failed = false
  try {
    const [cats, list] = await Promise.all([
      listCategories({ limit: 100 }),
      listCourses({ ...filters, limit, page }),
    ])
    categories = cats?.items || []
    courses = list
  } catch (err) {
    if (!(err instanceof CatalogueUnavailableError)) throw err
    failed = true
  }

  const activeFilters = [
    filters.q && { key: 'q', label: `Search: “${filters.q}”` },
    filters.category && { key: 'category', label: `Category: ${categories.find(c => c.slug === filters.category)?.name || filters.category}` },
    filters.mode && { key: 'mode', label: `Mode: ${filters.mode === 'home' ? 'Home' : 'Online'}` },
  ].filter(Boolean)

  const totalPages = courses ? Math.max(Math.ceil(courses.total / limit), 1) : 1

  return (
    <div className="min-h-screen bg-ivory font-landing text-ink">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage">Courses</p>
        <h1 className="mt-3 max-w-[22ch] text-3xl font-extrabold tracking-tight sm:text-4xl">Find the right course for your learner.</h1>

        <form method="get" action="/courses" role="search" className="mt-8 grid gap-3 rounded-3xl border border-ink/10 bg-white p-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end md:p-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Search</span>
            <input
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder="Class, subject, exam or degree"
              className="h-11 w-full rounded-xl border border-ink/20 bg-white px-3 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Category</span>
            <select name="category" defaultValue={filters.category} className="h-11 w-full rounded-xl border border-ink/20 bg-white px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink">
              <option value="">All categories</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Learning mode</span>
            <select name="mode" defaultValue={filters.mode} className="h-11 w-full rounded-xl border border-ink/20 bg-white px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink">
              {MODE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <button type="submit" className="h-11 rounded-full border border-ink bg-lemon px-6 font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">
            Apply
          </button>
        </form>

        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
            {activeFilters.map(f => (
              <Link
                key={f.key}
                href={buildHref(filters, { [f.key]: '', page: undefined })}
                className="inline-flex min-h-[36px] items-center gap-2 rounded-full bg-lavender/70 px-3 text-sm font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                {f.label}
                <span aria-hidden="true">×</span>
                <span className="sr-only">Remove filter</span>
              </Link>
            ))}
            <Link href="/courses" className="rounded-md px-2 text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink">
              Clear all
            </Link>
          </div>
        )}

        <div className="mt-8">
          {failed ? (
            <CatalogueUnavailable />
          ) : courses.items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-ink/25 bg-white p-10 text-center">
              <p className="font-semibold">No courses match these filters yet.</p>
              <p className="mt-2 text-sm text-sage">Try a different search, or <Link href="/courses" className="underline underline-offset-4">clear the filters</Link>.</p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-sage" aria-live="polite">{courses.total} course{courses.total === 1 ? '' : 's'}</p>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.items.map(course => <CourseCard key={course.id} course={course} />)}
              </ul>
              {totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4 text-sm font-semibold">
                  {page > 1 ? <Link href={buildHref(filters, { page: page - 1 })} className="rounded-full border border-ink/25 px-4 py-2">Previous</Link> : <span className="px-4 py-2 text-ink/30">Previous</span>}
                  <span>Page {page} of {totalPages}</span>
                  {page < totalPages ? <Link href={buildHref(filters, { page: page + 1 })} className="rounded-full border border-ink/25 px-4 py-2">Next</Link> : <span className="px-4 py-2 text-ink/30">Next</span>}
                </nav>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
