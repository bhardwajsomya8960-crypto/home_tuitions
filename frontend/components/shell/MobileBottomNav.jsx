'use client'

import { useEffect, useRef, useState } from 'react'
import { FiMoreHorizontal, FiX } from 'react-icons/fi'

const MAX_VISIBLE_TABS = 5

// Up to 5 items fit as tabs. With more, the first 4 stay as tabs and the rest sit in a "More" sheet.
export default function MobileBottomNav({ navItems, activeTab, onNavigate }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const sheetRef = useRef(null)

  const useMore = navItems.length > MAX_VISIBLE_TABS
  const visibleItems = useMore ? navItems.slice(0, MAX_VISIBLE_TABS - 1) : navItems
  const overflowItems = useMore ? navItems.slice(MAX_VISIBLE_TABS - 1) : []
  const overflowActive = overflowItems.some(item => item.id === activeTab)

  useEffect(() => {
    if (!sheetOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setSheetOpen(false) }
    document.addEventListener('keydown', onKey)
    sheetRef.current?.querySelector('button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [sheetOpen])

  const select = (id) => {
    setSheetOpen(false)
    onNavigate(id)
  }

  const tabClass = (isActive) =>
    `flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-lg ${
      isActive ? 'text-ink font-semibold' : 'text-sage'
    }`

  return (
    <>
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close more menu"
            className="absolute inset-0 bg-ink/50"
            onClick={() => setSheetOpen(false)}
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="More sections"
            className="relative bg-ivory rounded-t-2xl p-4 pb-8 space-y-1 max-h-[70vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-ink">More</p>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-sage hover:bg-sand-100"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            {overflowItems.map(item => {
              const Icon = item.icon
              const isActive = item.id === activeTab
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => select(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-[52px] flex items-center gap-3 px-3 rounded-lg text-left text-base font-medium ${
                    isActive ? 'bg-lemon text-ink' : 'text-ink/80 hover:bg-sand-100'
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-ivory border-t border-ink/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch px-2">
          {visibleItems.map(item => {
            const Icon = item.icon
            const isActive = item.id === activeTab
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={tabClass(isActive)}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full ${isActive ? 'bg-lemon' : ''}`}><Icon className="w-5 h-5" aria-hidden="true" /></span>
                <span>{item.label}</span>
              </button>
            )
          })}
          {useMore && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              className={tabClass(overflowActive)}
            >
              <FiMoreHorizontal className="w-5 h-5" aria-hidden="true" />
              <span>More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  )
}
