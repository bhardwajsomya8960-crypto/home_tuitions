import { FiInbox } from 'react-icons/fi'

export function Card({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 md:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
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
      <FiInbox className="h-8 w-8 text-gray-300" aria-hidden="true" />
      <p className="font-medium text-gray-800">{title}</p>
      {children && <p className="max-w-md text-sm text-gray-500">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div role="status" className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
      <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" aria-hidden="true" />
      {label}
    </div>
  )
}

// Field/value table for record details (no card grids).
export function Details({ items }) {
  const rows = items.filter(Boolean)
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <tbody className="divide-y divide-gray-100">
          {rows.map(([label, value]) => (
            <tr key={label} className="align-top">
              <th scope="row" className="w-2/5 whitespace-nowrap bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:w-1/3">{label}</th>
              <td className="break-words px-4 py-2.5 font-medium text-gray-900">{value || '—'}</td>
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
    <section aria-label={title} className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm" style={{ minWidth: items.length * 140 }}>
        <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr className="border-b border-gray-200">
            {items.map(i => <th key={i.label} scope="col" className="whitespace-nowrap px-4 py-2.5">{i.label}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr className="align-top">
            {items.map(i => (
              <td key={i.label} className="px-4 py-3">
                <span className={`block text-xl font-bold tabular-nums md:text-2xl ${toneClass[i.tone] || 'text-gray-900'}`}>{i.value}</span>
                {i.hint && <span className="mt-0.5 block text-xs text-gray-500">{i.hint}</span>}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  )
}

export const btn = {
  primary: 'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  secondary: 'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  success: 'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2',
  danger: 'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
  link: 'text-sm font-semibold text-blue-700 underline-offset-2 hover:underline disabled:text-gray-400',
}
