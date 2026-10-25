'use client'

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

// Returns page numbers with '…' gaps, e.g. 1 … 4 5 6 … 16
function pageItems(current, count) {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const items = [1]
  const left = Math.max(2, current - 1)
  const right = Math.min(count - 1, current + 1)
  if (left > 2) items.push('gap-start')
  for (let p = left; p <= right; p++) items.push(p)
  if (right < count - 1) items.push('gap-end')
  items.push(count)
  return items
}

const navButton =
  'inline-flex items-center justify-center min-w-[36px] h-9 px-2 rounded-md border border-sand-300 bg-white text-sm font-medium text-ink/80 hover:bg-sand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white'

export default function Pagination({ page, pageCount, total, start, end, pageSize, pageSizes, onPage, onPageSize, noun = 'records' }) {
  const hasPrev = page > 1
  const hasNext = page < pageCount

  return (
    <nav aria-label="Table pagination" className="flex flex-col gap-3 border-t border-sand-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-sage" aria-live="polite">
        Showing <span className="font-semibold text-ink">{start}–{end}</span> of{' '}
        <span className="font-semibold text-ink">{total}</span> {noun}
      </p>

      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        <label className="flex items-center gap-2 text-sm text-sage">
          Rows per page
          <select
            value={pageSize}
            onChange={e => onPageSize(Number(e.target.value))}
            className="h-9 rounded-md border border-sand-300 bg-white px-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            {pageSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>

        {/* Compact: phones */}
        <div className="flex items-center gap-2 md:hidden">
          <button type="button" className={navButton} onClick={() => onPage(page - 1)} disabled={!hasPrev} aria-label="Previous page">
            <FiChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <span className="text-sm text-ink/80 whitespace-nowrap">Page {page} of {pageCount}</span>
          <button type="button" className={navButton} onClick={() => onPage(page + 1)} disabled={!hasNext} aria-label="Next page">
            <FiChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Full: tablet and up */}
        <div className="hidden md:flex items-center gap-1">
          <button type="button" className={`${navButton} gap-1 px-3`} onClick={() => onPage(page - 1)} disabled={!hasPrev}>
            <FiChevronLeft className="w-4 h-4" aria-hidden="true" />
            Previous
          </button>
          {pageItems(page, pageCount).map(item =>
            typeof item === 'number' ? (
              <button
                key={item}
                type="button"
                onClick={() => onPage(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={`${navButton} ${item === page ? '!bg-ink !border-ink !text-white hover:!bg-ink/90' : ''}`}
              >
                {item}
              </button>
            ) : (
              <span key={item} className="px-2 text-sage-soft" aria-hidden="true">…</span>
            )
          )}
          <button type="button" className={`${navButton} gap-1 px-3`} onClick={() => onPage(page + 1)} disabled={!hasNext}>
            Next
            <FiChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  )
}
