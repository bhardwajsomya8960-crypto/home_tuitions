'use client'

import { useEffect, useState } from 'react'
import { FiWifiOff, FiRefreshCw } from 'react-icons/fi'

function useOnlineStatus() {
  const [online, setOnline] = useState(true)
  useEffect(() => {
    setOnline(navigator.onLine)
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])
  return online
}

// Shows a banner when a new service worker is waiting. Activation is manual so the
// user is not interrupted mid-form; "Update" hands the waiting worker SKIP_WAITING.
function useWaitingWorker() {
  const [registration, setRegistration] = useState(null)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let cancelled = false
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg || cancelled) return
      if (reg.waiting) setRegistration(reg)
      reg.addEventListener('updatefound', () => {
        const next = reg.installing
        next?.addEventListener('statechange', () => {
          if (next.state === 'installed' && navigator.serviceWorker.controller) setRegistration(reg)
        })
      })
    })
    return () => { cancelled = true }
  }, [])
  return registration
}

export default function ConnectionStatus() {
  const online = useOnlineStatus()
  const waitingReg = useWaitingWorker()

  const applyUpdate = () => {
    if (!waitingReg?.waiting) return
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
    waitingReg.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  return (
    <div className="fixed top-0 inset-x-0 z-[60] pointer-events-none flex flex-col items-center gap-2 p-2" style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}>
      {!online && (
        <div role="status" className="pointer-events-auto flex items-center gap-2 bg-gray-900 text-white text-sm rounded-lg px-4 py-2 shadow-lg max-w-md w-full">
          <FiWifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>You're offline. Information shown may be out of date.</span>
        </div>
      )}
      {waitingReg && (
        <div role="status" className="pointer-events-auto flex items-center justify-between gap-3 bg-blue-600 text-white text-sm rounded-lg px-4 py-2 shadow-lg max-w-md w-full">
          <span>A new version is available.</span>
          <button
            type="button"
            onClick={applyUpdate}
            className="flex items-center gap-1.5 font-semibold bg-white text-blue-700 rounded-md px-3 py-1.5 min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <FiRefreshCw className="w-4 h-4" aria-hidden="true" />
            Update
          </button>
        </div>
      )}
    </div>
  )
}
