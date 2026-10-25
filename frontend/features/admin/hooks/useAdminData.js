'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/shared/lib/api'

// Loads one admin endpoint; `version` forces a reload after changes elsewhere.
export function useAdminData(path, version) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const load = useCallback(() => api(path, { role: 'admin' }).then(d => { setData(d); setError('') }).catch(e => setError(e.message)), [path])
  useEffect(() => { load() }, [load, version])
  return { data, error, reload: load }
}
