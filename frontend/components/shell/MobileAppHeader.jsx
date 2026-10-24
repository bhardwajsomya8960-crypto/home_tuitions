'use client'

import { FiLogOut } from 'react-icons/fi'

export default function MobileAppHeader({ portalLabel, title, onLogout }) {
  return (
    <header
      className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center gap-3 px-4 h-14">
        <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
          ht
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 leading-tight">{portalLabel}</p>
          <p className="font-semibold text-gray-900 truncate leading-tight">{title}</p>
        </div>
        {onLogout && (
          <button type="button" onClick={onLogout} aria-label="Sign out" className="flex h-11 w-11 items-center justify-center rounded-lg text-red-700 hover:bg-red-50">
            <FiLogOut className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  )
}
