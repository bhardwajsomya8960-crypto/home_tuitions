import Link from 'next/link'
import { FiArrowRight } from 'react-icons/fi'
import { CatalogueUnavailableError, listCategories } from '@/features/website/api/catalogueApi'
import CatalogueUnavailable from '@/features/website/components/catalogue/CatalogueUnavailable'
import Reveal from '@/features/website/components/landing/Reveal'

// Published categories from the catalogue API. Nothing here is hardcoded.
export default async function CategoryDiscovery() {
  let categories
  try {
    const result = await listCategories({ limit: 12 })
    categories = result?.items || []
  } catch (err) {
    if (!(err instanceof CatalogueUnavailableError)) throw err
    categories = null
  }

  return (
    <section aria-labelledby="discover-title" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
      <Reveal>
        <h2 id="discover-title" className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Whatever you&apos;re learning, start here.</h2>
      </Reveal>
      <div className="mt-8">
        {categories === null ? (
          <CatalogueUnavailable message="We could not load learning categories right now." />
        ) : categories.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-ink/25 bg-white p-8 text-center text-sage">New categories are on the way.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={Math.min(i, 5) * 0.05} className="h-full">
                <li className="h-full list-none">
                  <Link
                    href={`/categories/${c.slug}`}
                    className="group flex h-full flex-col rounded-3xl border border-ink/10 p-6 transition-[transform,border-color] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
                    style={{ backgroundColor: c.accentColour || '#FFFFFF' }}
                  >
                    <h3 className="text-lg font-bold text-ink">{c.name}</h3>
                    {c.shortDescription && <p className="mt-2 text-sm leading-relaxed text-ink/85">{c.shortDescription}</p>}
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-ink">
                      Explore
                      <FiArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-6 text-sm text-sage">
        <Link href="/courses" className="font-semibold text-ink underline underline-offset-4">Browse all courses</Link>
      </p>
    </section>
  )
}
