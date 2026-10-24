// Compact table for short lists inside panels (queues, offers, history). Use DataTable for
// long lists that need search, filters and paging. Scrolls sideways on narrow screens.
//
// columns: [{ key, header, render(row), align?, className?, sticky? }]
// sticky: true keeps that column (usually the actions) pinned to the right edge while scrolling.
// flush: stretch to the edges of a Card body; otherwise draw a bordered box (inside dialogs).
export default function SimpleTable({ columns, rows, rowKey = r => r.id, empty = 'Nothing here yet.', rowClassName, minWidth = 640, flush = true }) {
  if (!rows.length) return <p className={`py-4 text-center text-sm text-gray-500 ${flush ? '' : 'rounded-lg border border-gray-200'}`}>{empty}</p>
  const pin = c => (c.sticky ? 'sticky right-0 z-[1] shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]' : '')
  return (
    <div className={flush ? '-mx-4 overflow-x-auto md:-mx-5' : 'overflow-x-auto rounded-lg border border-gray-200'}>
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr className={flush ? 'border-y border-gray-200' : 'border-b border-gray-200'}>
            {columns.map(c => (
              <th key={c.key} scope="col" className={`whitespace-nowrap px-4 py-2.5 md:px-5 ${c.align === 'right' ? 'text-right' : ''} ${c.sticky ? `${pin(c)} bg-gray-50` : ''}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(row => (
            <tr key={rowKey(row)} className={`align-top hover:bg-gray-50 ${rowClassName ? rowClassName(row) : ''}`}>
              {columns.map(c => (
                <td key={c.key} className={`px-4 py-3 md:px-5 ${c.align === 'right' ? 'text-right' : ''} ${c.className || ''} ${c.sticky ? `${pin(c)} bg-white` : ''}`}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
