import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '../../../components/landing/SiteHeader'
import { SiteFooter } from '../../../components/landing/Sections'
import CatalogueUnavailable from '../../../components/catalogue/CatalogueUnavailable'
import { CatalogueUnavailableError, getCourse } from '../../../lib/catalogueApi'

export const revalidate = 60

const MODE_TEXT = {
  home: 'Home tuition is available for this course.',
  online: 'Online tuition is available for this course.',
}

async function load(slug) {
  try {
    return { course: await getCourse(slug) }
  } catch (err) {
    if (err instanceof CatalogueUnavailableError) return { failed: true }
    throw err
  }
}

export async function generateMetadata({ params }) {
  const { course, failed } = await load(params.slug)
  if (failed) return { title: 'Course | Home Tuition' }
  if (!course) return { title: 'Course not found | Home Tuition' }
  return {
    title: course.seoTitle || `${course.name} | Home Tuition`,
    description: course.seoDescription || course.shortDescription || undefined,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: {
      title: course.seoTitle || course.name,
      description: course.seoDescription || course.shortDescription || undefined,
      type: 'website',
    },
  }
}

function Section({ title, children }) {
  return (
    <section className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-3 text-base leading-relaxed text-ink/85">{children}</div>
    </section>
  )
}

function ListBlock({ items }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map(item => <li key={item}>{item}</li>)}
    </ul>
  )
}

export default async function CoursePage({ params }) {
  const { course, failed } = await load(params.slug)
  if (failed) {
    return (
      <Shell>
        <CatalogueUnavailable retryHref={`/courses/${params.slug}`} message="We could not load this course right now." />
      </Shell>
    )
  }
  if (!course) notFound()

  const hasObjectives = course.learningObjectives.length > 0
  const hasPrerequisites = course.prerequisites.length > 0

  return (
    <Shell>
      <nav aria-label="Breadcrumb" className="text-sm text-sage">
        <Link href="/courses" className="underline underline-offset-4 hover:text-ink">Courses</Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/categories/${course.category.slug}`} className="underline underline-offset-4 hover:text-ink">{course.category.name}</Link>
      </nav>

      <header className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage">{course.levelLabel || 'Course'}</p>
        <h1 className="mt-3 max-w-[24ch] text-3xl font-extrabold tracking-tight sm:text-4xl">{course.name}</h1>
        {course.shortDescription && <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink/85">{course.shortDescription}</p>}
        <div className="mt-6">
          <Link
            href={`/parent/register?course=${encodeURIComponent(course.slug)}${course.learningModes.length === 1 ? `&mode=${course.learningModes[0]}` : ''}`}
            className="inline-flex min-h-[52px] items-center rounded-full border border-ink bg-lemon px-7 text-base font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
          >
            Enquire About This Course
          </Link>
        </div>
      </header>

      <div className="mt-10 grid gap-5">
        {course.description && (
          <Section title="Course overview">
            <p className="whitespace-pre-line">{course.description}</p>
          </Section>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {course.applicableFor && (
            <Section title="Suitable for">
              <p>{course.applicableFor}</p>
            </Section>
          )}
          <Section title="Learning mode">
            <ul className="space-y-2">
              {course.learningModes.map(mode => <li key={mode}>{MODE_TEXT[mode]}</li>)}
            </ul>
          </Section>
        </div>

        {course.subjects.length > 0 && (
          <Section title="Subjects and topics">
            <ListBlock items={course.subjects} />
          </Section>
        )}

        {(hasObjectives || hasPrerequisites) && (
          <div className="grid gap-5">
            {hasObjectives && (
              <details className="group rounded-3xl border border-ink/10 bg-white p-6 sm:p-8" open>
                <summary className="cursor-pointer text-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink">Learning objectives</summary>
                <div className="mt-4"><ListBlock items={course.learningObjectives} /></div>
              </details>
            )}
            {hasPrerequisites && (
              <details className="group rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
                <summary className="cursor-pointer text-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink">Prerequisites</summary>
                <div className="mt-4"><ListBlock items={course.prerequisites} /></div>
              </details>
            )}
          </div>
        )}

        {course.targetAudience && (
          <Section title="Who this is for">
            <p>{course.targetAudience}</p>
          </Section>
        )}
      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-ivory font-landing text-ink">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">{children}</main>
      <SiteFooter />
    </div>
  )
}
