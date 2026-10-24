'use client'

import { useMemo, useState } from 'react'
import { FiSearch, FiChevronUp, FiChevronDown, FiInbox } from 'react-icons/fi'
import Pagination from './Pagination'

// Shared table for all dashboards. Desktop (md+) renders a table; phones render
// `renderCard` for each row. Paging, search, filters and sorting run on the same
// filtered list, so both layouts always agree.
//
// columns:  [{ key, header, render(row), sortValue?(row), sortable?, align? }]
// filters:  [{ key, label, get(row), options: [{ value, label }] }]
// searchText(row): string used by the search box
export default function DataTable({
  title,
  noun = 'records',
  rows,
  rowKey,
  columns,
  searchText,
  searchPlaceholder = 'Search',
  filters = [],
  renderCard,
  emptyMessage = 'No records yet.',
  noMatchMessage = 'No records match your search or filters.',
  pageSizes = [10, 20, 50],
  defaultPageSize = 10,
  toolbarExtra,
}) {
  const [query, setQuery] = useState('')
  const [filterValues, setFilterValues] = useState({})
  const [sort, setSort] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = rows.filter(row => {
      if (q && !(searchText ? searchText(row) : '').toLowerCase().includes(q)) return false
      return filters.every(f => !filterValues[f.key] || String(f.get(row)) === filterValues[f.key])
    })
    if (sort) {
      const col = columns.find(c => c.key === sort.key)
      const valueOf = col?.sortValue || (r => r[sort.key])
      out = [...out].sort((a, b) => {
        const x = valueOf(a)
        const y = valueOf(b)
        if (x < y) return -sort.dir
        if (x > y) return sort.dir
        return 0
      })
    }
    return out
  }, [rows, query, filterValues, sort, columns, filters, searchText])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  // Keeps the page valid when filtering shrinks the list
  const current = Math.min(page, pageCount)
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1
  const end = Math.min(current * pageSize, total)
  const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize)

  const changeQuery = (value) => { setQuery(value); setPage(1) }
  const changeFilter = (key, value) => { setFilterValues(prev => ({ ...prev, [key]: value })); setPage(1) }
  const toggleSort = (key) => {
    setSort(prev => (prev?.key === key ? { key, dir: prev.dir * -1 } : { key, dir: 1 }))
    setPage(1)
  }
  const changePageSize = (size) => { setPageSize(size); setPage(1) }

  const hasRows = rows.length > 0
  const isEmpty = total === 0

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between md:px-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{rows.length} {noun} in total</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex-1 min-w-[180px] md:w-64">
            <span className="sr-only">{searchPlaceholder}</span>
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={e => changeQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-9 pl-9 pr-3 rounded-md border border-gray-300 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </label>
          {filters.map(f => (
            <select
              key={f.key}
              aria-label={`Filter by ${f.label}`}
              value={filterValues[f.key] || ''}
              onChange={e => changeFilter(f.key, e.target.value)}
              className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="">All {f.label}</option>
              {f.options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
          {toolbarExtra}
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-gray-500">
          <FiInbox className="w-8 h-8 text-gray-300" aria-hidden="true" />
          <p className="text-sm">{hasRows ? noMatchMessage : emptyMessage}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr className="border-b border-gray-200">
                  {columns.map(col => {
                    const isSorted = sort?.key === col.key
                    const ariaSort = isSorted ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined
                    return (
                      <th
                        key={col.key}
                        scope="col"
                        aria-sort={col.sortable ? ariaSort || 'none' : undefined}
                        className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''} ${col.className || ''}`}
                      >
                        {col.sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(col.key)}
                            className="inline-flex items-center gap-1 rounded hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            {col.header}
                            {isSorted && (sort.dir === 1
                              ? <FiChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                              : <FiChevronDown className="w-3.5 h-3.5" aria-hidden="true" />)}
                          </button>
                        ) : col.header}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageRows.map(row => (
                  <tr key={rowKey(row)} className="hover:bg-gray-50">
                    {columns.map(col => (
                      <td key={col.key} className={`px-4 py-3.5 align-middle ${col.align === 'right' ? 'text-right' : ''} ${col.cellClassName || ''}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone cards */}
          <div className="md:hidden space-y-3 p-3">
            {pageRows.map(row => (
              <div key={rowKey(row)}>{renderCard ? renderCard(row) : null}</div>
            ))}
          </div>
        </>
      )}

      {total > 0 && (
        <Pagination
          page={current}
          pageCount={pageCount}
          total={total}
          start={start}
          end={end}
          pageSize={pageSize}
          pageSizes={pageSizes}
          onPage={setPage}
          onPageSize={changePageSize}
          noun={noun}
        />
      )}
    </section>
  )
}

// Builds filter options from the values actually present in the rows
export function optionsFrom(rows, get, label = value => value) {
  return [...new Set(rows.map(get))].map(value => ({ value: String(value), label: label(value) }))
}
