'use client'

import { useEffect, useState } from 'react'
import { api } from '@/shared/lib/api'
import { WEBSITE_API } from '@/shared/lib/endpoints'

// Master data (classes, subjects, slots, reasons…) from GET /api/masters, fetched once per page load.
let cached = null
let pending = null

export function useMasters() {
  const [masters, setMasters] = useState(cached)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cached) return
    pending ||= api(WEBSITE_API.masters)
    pending
      .then(m => { cached = m; setMasters(m) })
      .catch(err => { pending = null; setError(err) })
  }, [])

  return { masters, error }
}

export const optionLabel = (list, value) => list?.find(o => (o.value ?? o) === value)?.label ?? value
