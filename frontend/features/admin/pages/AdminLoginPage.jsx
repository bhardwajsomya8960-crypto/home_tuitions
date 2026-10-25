'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo, { BrandLockup, BRAND_NAME } from '@/shared/brand/Logo'
import { api, getSession, setSession } from '@/shared/lib/api'
import { Notice, TextInput } from '@/shared/ui/Form'
import { btn } from '@/shared/ui/Card'
import { ADMIN_API } from '@/features/admin/api/endpoints'

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
      const res = await api(ADMIN_API.login, { method: 'POST', body: { email, password } })
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
    <div className="grid min-h-screen bg-ivory font-landing text-ink lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-ivory lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ivory"><Logo className="h-11 w-11" /></span>
          <span className="text-lg font-bold">{BRAND_NAME}</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-lemon">Operations console</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight tracking-tight">Every lead, tutor and class in one place.</h2>
          <p className="mt-4 text-ivory/70">Match tutors, schedule demos, convert enrolments and keep fees on track.</p>
        </div>
        <p className="relative z-10 text-xs text-ivory/50">Staff access only. Every action is recorded in the audit log.</p>
        <span aria-hidden="true" className="absolute -right-24 top-24 h-72 w-72 rounded-full border-[16px] border-lavender/25" />
        <span aria-hidden="true" className="absolute bottom-20 right-24 h-24 w-24 rounded-full bg-lemon" />
        <span aria-hidden="true" className="absolute bottom-48 right-56 h-6 w-6 rounded-full bg-coral" />
      </aside>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-6 flex justify-center"><BrandLockup className="h-20 w-auto" /></Link>
          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">For staff</p>
              <h1 className="mt-1 text-2xl font-bold">Operations sign-in</h1>
            </div>
            <TextInput label="Email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
            <TextInput label="Password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
            <Notice>{error}</Notice>
            <button type="submit" disabled={busy || !email || !password} className={`${btn.primary} min-h-[48px] w-full`}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <p className="mt-6 text-center text-xs text-sage">Parent or tutor? <Link href="/login" className="font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-4">Sign in here</Link></p>
        </div>
      </div>
    </div>
  )
}
