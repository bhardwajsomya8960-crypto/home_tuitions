'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError, clearSession, getSession } from '@/shared/lib/api'

const LOGIN_PATH = { parent: '/login?role=parent', tutor: '/login?role=tutor', admin: '/admin/login' }

// Loads a portal's data for a signed-in role. Without a session (or when it has expired) the
// user is sent to sign in. `run(fn)` wraps an action: it shows progress, reports errors, and
// reloads the data afterwards.
export function usePortal(role, path) {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const toLogin = useCallback(() => router.replace(LOGIN_PATH[role]), [role, router])

  const load = useCallback(async () => {
    if (!getSession(role)) return toLogin()
    try {
      setData(await api(path, { role }))
      setError('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return toLogin()
      setError(err.message)
    }
    return undefined
  }, [role, path, toLogin])

  useEffect(() => { load() }, [load])

  const run = useCallback(async (fn, successMessage) => {
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await fn()
      if (successMessage) setMessage(successMessage)
      await load()
      return result
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) toLogin()
      setError(err.message)
      throw err
    } finally {
      setBusy(false)
    }
  }, [load, toLogin])

  const logout = useCallback(() => {
    clearSession(role)
    router.replace(role === 'admin' ? '/admin/login' : '/login')
  }, [role, router])

  return { data, error, setError, message, setMessage, busy, reload: load, run, logout }
}
