'use client'

import { useEffect, useState } from 'react'
import { FiClock } from 'react-icons/fi'

// Live countdown to `expiresAt`. Calls onExpire once when it reaches zero.
export default function Countdown({ expiresAt, onExpire }) {
  const left = () => Math.max(0, Math.round((Date.parse(expiresAt) - Date.now()) / 1000))
  const [seconds, setSeconds] = useState(left)

  useEffect(() => {
    setSeconds(left())
    const timer = setInterval(() => {
      const s = left()
      setSeconds(s)
      if (s === 0) {
        clearInterval(timer)
        onExpire?.()
      }
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt])

  const m = Math.floor(seconds / 60)
  const s = String(seconds % 60).padStart(2, '0')
  const urgent = seconds <= 120
  return (
    <span role="timer" aria-live="off" aria-label={`${m} minutes ${s} seconds left`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${seconds === 0 ? 'bg-gray-100 text-gray-500' : urgent ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-800'}`}>
      <FiClock className="h-4 w-4" aria-hidden="true" />
      {seconds === 0 ? 'Expired' : `${m}:${s} left`}
    </span>
  )
}
