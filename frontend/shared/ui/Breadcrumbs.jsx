import Link from 'next/link'
import { breadcrumbJsonLd } from '@/shared/lib/seo'
import JsonLd from '@/shared/ui/JsonLd'

// Visible breadcrumbs plus the matching BreadcrumbList structured data, from one list so the
// two always agree. items: [{ name, path }] from Home to the current page.
export default function Breadcrumbs({ items, className = '' }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className={`text-sm text-sage ${className}`}>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {items.map((item, i) => {
            const last = i === items.length - 1
            return (
              <li key={item.path} className="flex items-center gap-1.5">
                {last
                  ? <span aria-current="page" className="text-ink">{item.name}</span>
                  : <Link href={item.path} className="underline underline-offset-4 hover:text-ink">{item.name}</Link>}
                {!last && <span aria-hidden="true">/</span>}
              </li>
            )
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  )
}
