'use client'

import { useEffect, useRef } from 'react'
import { FiX } from 'react-icons/fi'

// Accessible dialog: focus moves in on open, Escape closes, the page behind cannot scroll.
// On phones it opens as a bottom sheet.
export default function Modal({ open, title, onClose, children, footer, wide = false }) {
  const ref = useRef(null)
  // Callers pass inline handlers; keep the latest in a ref so the effect runs only on open/close
  // (re-running it would move focus back to the first field on every keystroke).
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    // With nested dialogs, Escape closes only the top one.
    const onKey = e => {
      if (e.key !== 'Escape') return
      const dialogs = document.querySelectorAll('[role="dialog"]')
      if (dialogs[dialogs.length - 1] === ref.current) closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector('input, select, textarea, button:not([data-close])')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      if (document.querySelectorAll('[role="dialog"]').length <= 1) document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" aria-label="Close dialog" data-close className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button type="button" data-close onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
            <FiX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}
