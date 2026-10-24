'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '../../components/landing/Logo'
import PhoneVerify from '../../components/ui/PhoneVerify'
import { getSession, setSession } from '../../lib/api'

const HOME = { parent: '/parent/dashboard', tutor: '/tutor/dashboard' }

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [role, setRole] = useState(params.get('role') === 'tutor' ? 'tutor' : 'parent')
  const [phone, setPhone] = useState('')

  // Already signed in for this role: go straight to the portal.
  useEffect(() => {
    if (getSession(role)) router.replace(HOME[role])
  }, [role, router])

  const onVerified = ({ token, user }) => {
    setSession(role, { token, user })
    router.replace(HOME[role])
  }

  return (
    <div className="min-h-screen bg-ivory px-4 py-10 font-landing text-ink">
      <div className="mx-auto max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Logo />
          <span className="text-lg font-bold">Home Tuition</span>
        </Link>
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-gray-600">Use the mobile number you registered with.</p>

          <div role="tablist" aria-label="Account type" className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-gray-100 p-1">
            {[['parent', 'Parent'], ['tutor', 'Tutor']].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={role === value}
                onClick={() => setRole(value)}
                className={`min-h-[44px] rounded-full text-sm font-semibold transition ${role === value ? 'bg-white text-ink shadow-sm' : 'text-gray-600'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <PhoneVerify key={role} role={role} purpose="login" phone={phone} onPhoneChange={setPhone} onVerified={onVerified} accent="ink" />
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            {role === 'parent'
              ? <>New here? <Link href="/parent/register" className="font-semibold text-ink underline decoration-lemon decoration-4 underline-offset-4">Start an enquiry</Link></>
              : <>New tutor? <Link href="/tutor/register" className="font-semibold text-ink underline decoration-lemon decoration-4 underline-offset-4">Register to teach</Link></>}
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-gray-500">Staff? <Link href="/admin/login" className="underline">Admin sign-in</Link></p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
