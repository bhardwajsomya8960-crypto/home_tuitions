import { FiInbox } from 'react-icons/fi'

export function Card({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-ink/10 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 px-4 py-3.5 md:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-base font-bold text-ink">{title}</h2>}
            {subtitle && <p className="text-sm text-sage">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4 md:p-5">{children}</div>
    </section>
  )
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <FiInbox className="h-8 w-8 text-sage-soft" aria-hidden="true" />
      <p className="font-medium text-ink">{title}</p>
      {children && <p className="max-w-md text-sm text-sage">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div role="status" className="flex min-h-[40vh] items-center justify-center text-sm text-sage">
      <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-sand-300 border-t-ink" aria-hidden="true" />
      {label}
    </div>
  )
}

// Field/value table for record details (no card grids).
export function Details({ items }) {
  const rows = items.filter(Boolean)
  return (
    <div className="overflow-x-auto rounded-lg border border-sand-200">
      <table className="w-full text-left text-sm">
        <tbody className="divide-y divide-sand-100">
          {rows.map(([label, value]) => (
            <tr key={label} className="align-top">
              <th scope="row" className="w-2/5 whitespace-nowrap bg-sand-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-sage sm:w-1/3">{label}</th>
              <td className="break-words px-4 py-2.5 font-medium text-ink">{value || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Key figures as one table: a column per metric, values below. Replaces stat tiles.
// items: [{ label, value, hint?, tone? }]   tone 'red' | 'orange' highlights a value that needs attention
export function SummaryTable({ items, title = 'Summary' }) {
  const toneClass = { red: 'text-red-700', orange: 'text-amber-700' }
  return (
    <section aria-label={title} className="overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
      <table className="w-full text-left text-sm" style={{ minWidth: items.length * 140 }}>
        <thead className="bg-lemon/40 text-xs font-semibold uppercase tracking-wide text-ink/80">
          <tr className="border-b border-ink/10">
            {items.map(i => <th key={i.label} scope="col" className="whitespace-nowrap px-4 py-2.5">{i.label}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr className="align-top">
            {items.map(i => (
              <td key={i.label} className="px-4 py-3">
                <span className={`block text-xl font-bold tabular-nums md:text-2xl ${toneClass[i.tone] || 'text-ink'}`}>{i.value}</span>
                {i.hint && <span className="mt-0.5 block text-xs text-sage">{i.hint}</span>}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  )
}

// Buttons follow the landing page: lemon pill with an ink outline for the main action.
const btnBase = 'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory'
export const btn = {
  primary: `${btnBase} border border-ink bg-lemon text-ink shadow-[0_1px_0_rgba(38,53,47,0.9)] hover:bg-[#f2e04f]`,
  secondary: `${btnBase} border border-ink/20 bg-white text-ink hover:bg-sand-50`,
  success: `${btnBase} border border-ink bg-mint text-ink hover:bg-[#b8e3c6]`,
  danger: `${btnBase} border border-red-200 bg-white text-red-700 hover:bg-red-50`,
  link: 'text-sm font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-4 hover:decoration-ink disabled:text-sage-soft disabled:no-underline',
}
