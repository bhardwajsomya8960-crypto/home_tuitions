import Link from 'next/link'

const MODE_LABEL = { home: 'Home', online: 'Online' }

export default function CourseCard({ course }) {
  return (
    <li className="h-full">
      <Link
        href={`/courses/${course.slug}`}
        className="group flex h-full flex-col rounded-3xl border border-ink/10 bg-white p-6 transition-[transform,border-color] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">{course.levelLabel || 'Course'}</p>
        <h3 className="mt-2 text-lg font-bold text-ink group-hover:underline underline-offset-4">{course.name}</h3>
        {course.shortDescription && <p className="mt-2 text-sm leading-relaxed text-ink/80">{course.shortDescription}</p>}
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {course.learningModes.map(mode => (
            <span key={mode} className="rounded-full bg-mint/70 px-3 py-1 text-xs font-medium text-ink">
              {MODE_LABEL[mode] || mode}
            </span>
          ))}
        </div>
      </Link>
    </li>
  )
}
