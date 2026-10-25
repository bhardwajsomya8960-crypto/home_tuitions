'use client'

// Phone card for one record. Shows the key fields first and keeps actions reachable without hover.
export default function RecordCard({ title, subtitle, badge, fields = [], actions }) {
  return (
    <article className="rounded-lg border border-sand-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink truncate">{title}</p>
          {subtitle && <p className="text-sm text-sage truncate">{subtitle}</p>}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
      {fields.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {fields.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-sage">{label}</dt>
              <dd className="font-medium text-ink truncate">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </article>
  )
}
