'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BrandLockup } from '../../components/landing/Logo'
import HeroArt from '../../components/landing/HeroArt'
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
    <div className="min-h-screen bg-ivory font-landing text-ink">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <div className="hidden lg:block">
          <Link href="/" className="inline-flex"><BrandLockup className="h-24 w-auto" /></Link>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-sage">Welcome back</p>
          <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight">Pick up right where you left off.</h2>
          <p className="mt-3 max-w-md text-sage">{role === 'parent' ? 'See tutor updates, demo times, classes and fees for your child.' : 'See new lead offers, your classes and your verification status.'}</p>
          <div className="mt-6 max-w-md"><HeroArt /></div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-6 flex justify-center lg:hidden"><BrandLockup className="h-20 w-auto" /></Link>
          <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="mt-1 text-sm text-sage">Use the mobile number you registered with.</p>

            <div role="tablist" aria-label="Account type" className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-ink/10 bg-sand-50 p-1">
              {[['parent', 'Parent'], ['tutor', 'Tutor']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={role === value}
                  onClick={() => setRole(value)}
                  className={`min-h-[44px] rounded-full text-sm font-semibold transition ${role === value ? 'border border-ink bg-lemon text-ink' : 'text-sage hover:text-ink'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <PhoneVerify key={role} role={role} purpose="login" phone={phone} onPhoneChange={setPhone} onVerified={onVerified} />
            </div>

            <p className="mt-6 text-center text-sm text-sage">
              {role === 'parent'
                ? <>New here? <Link href="/parent/register" className="font-semibold text-ink underline decoration-lemon decoration-4 underline-offset-4">Start an enquiry</Link></>
                : <>New tutor? <Link href="/tutor/register" className="font-semibold text-ink underline decoration-lemon decoration-4 underline-offset-4">Register to teach</Link></>}
            </p>
          </div>
          <p className="mt-6 text-center text-xs text-sage">Staff? <Link href="/admin/login" className="underline">Admin sign-in</Link></p>
        </div>
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
