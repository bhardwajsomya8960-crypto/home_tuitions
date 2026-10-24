'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, getSession, setSession } from '../../../lib/api'
import { Notice, TextInput } from '../../../components/ui/Form'
import { btn } from '../../../components/ui/Card'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (getSession('admin')) router.replace('/admin/dashboard')
  }, [router])

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const res = await api('/api/admin/auth/login', { method: 'POST', body: { email, password } })
      setSession('admin', { token: res.token, user: { name: 'Administrator' } })
      router.replace('/admin/dashboard')
    } catch (err) {
      if (err.code === 'ADMIN_NOT_CONFIGURED') {
        const reasons = err.details.map(d => d.message)
        setError(`Admin access is not configured on the server${reasons.length ? `: ${reasons.join('; ')}` : ''}. Run "npm run setup:admin" in backend/ and restart the API.`)
      } else {
        setError(err.message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <div aria-hidden="true" className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">ht</div>
          <h1 className="text-xl font-bold text-gray-900">Operations sign-in</h1>
          <p className="text-sm text-gray-500">For staff only.</p>
        </div>
        <TextInput label="Email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
        <TextInput label="Password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
        <Notice>{error}</Notice>
        <button type="submit" disabled={busy || !email || !password} className={`${btn.primary} w-full`}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}
