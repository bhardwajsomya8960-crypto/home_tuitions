'use client'

import { useEffect, useRef, useState } from 'react'
import { FiLogOut, FiUser } from 'react-icons/fi'

// The one place the signed-in person is shown: an avatar that opens their name, a link to
// their profile (when the portal has one) and sign-out.
export default function ProfileMenu({ user, onProfile, profileLabel = 'My profile', onLogout, size = 'md' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector('button')?.focus() } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    ref.current?.querySelector('[role="menuitem"]')?.focus()
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = fn => () => { setOpen(false); fn() }
  const item = 'flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 text-left text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ink'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${user.name}`}
        title={user.name}
        className={`flex items-center justify-center rounded-full border border-ink bg-lemon font-semibold text-ink transition hover:bg-[#f2e04f] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory ${size === 'sm' ? 'h-9 w-9 text-sm' : 'h-10 w-10'}`}
      >
        {user.name.charAt(0).toUpperCase()}
      </button>

      {open && (
        <div role="menu" aria-label="Account" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-ink/10 bg-white p-2 shadow-lg">
          <div className="border-b border-ink/10 px-3 pb-3 pt-2">
            <p className="truncate font-semibold text-ink">{user.name}</p>
            {user.subtitle && <p className="truncate text-xs text-sage">{user.subtitle}</p>}
          </div>
          <div className="pt-2">
            {onProfile && (
              <button type="button" role="menuitem" onClick={choose(onProfile)} className={`${item} text-ink hover:bg-sand-50`}>
                <FiUser className="h-4 w-4" aria-hidden="true" /> {profileLabel}
              </button>
            )}
            {onLogout && (
              <button type="button" role="menuitem" onClick={choose(onLogout)} className={`${item} text-red-700 hover:bg-red-50`}>
                <FiLogOut className="h-4 w-4" aria-hidden="true" /> Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
