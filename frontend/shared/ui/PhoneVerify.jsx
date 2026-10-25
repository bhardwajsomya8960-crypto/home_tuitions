'use client'

import { useEffect, useState } from 'react'
import { FiCheckCircle } from 'react-icons/fi'
import { api, ApiError } from '@/shared/lib/api'
import { inputClass, Notice, TextInput } from '@/shared/ui/Form'
import { WEBSITE_API } from '@/shared/lib/endpoints'

// Mobile number with one-time-code verification.
// purpose "register" -> onVerified({ phone, phoneToken }); purpose "login" -> onVerified({ phone, token, user }).
// While no SMS provider is connected, the server can echo the code (OTP_DEV_ECHO) and it is shown here.
export default function PhoneVerify({ role, purpose, phone, onPhoneChange, onVerified, verified, disabled }) {
  const [stage, setStage] = useState('enter')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const validPhone = /^[6-9]\d{9}$/.test(phone || '')
  const btn = 'rounded-full border border-ink bg-lemon text-ink hover:bg-[#f2e04f]'

  async function send() {
    setBusy(true); setError('')
    try {
      const res = await api(WEBSITE_API.sendOtp, { method: 'POST', body: { phone, role, purpose } })
      setStage('code'); setCode(''); setDevCode(res.devCode || ''); setCooldown(30)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the code')
      if (err.details?.[0]?.retryAfterSeconds) setCooldown(err.details[0].retryAfterSeconds)
    } finally {
      setBusy(false)
    }
  }

  async function verify(e) {
    e?.preventDefault()
    setBusy(true); setError('')
    try {
      const res = await api(WEBSITE_API.verifyOtp, { method: 'POST', body: { phone, role, purpose, code } })
      setStage('done')
      onVerified({ phone, ...res })
    } catch (err) {
      setError(err.message)
      if (['OTP_EXPIRED', 'OTP_LOCKED'].includes(err.code)) setStage('enter')
    } finally {
      setBusy(false)
    }
  }

  if (verified) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-medium text-green-800">
          <FiCheckCircle className="h-5 w-5" aria-hidden="true" /> +91 {phone} verified
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <TextInput
          className="flex-1"
          label="Mobile number"
          required
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="10-digit mobile number"
          value={phone || ''}
          disabled={disabled || stage === 'code'}
          onChange={e => onPhoneChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          hint="We send a one-time code to confirm the number"
         
        />
        {stage === 'enter' && (
          <button type="button" onClick={send} disabled={!validPhone || busy || cooldown > 0} className={`mb-[22px] min-h-[44px] shrink-0 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${btn}`}>
            {busy ? 'Sending…' : cooldown > 0 ? `Wait ${cooldown}s` : 'Send code'}
          </button>
        )}
      </div>

      {stage === 'code' && (
        <form onSubmit={verify} className="space-y-2 rounded-lg border border-sand-200 bg-sand-50 p-4">
          <label htmlFor={`otp-${role}-${purpose}`} className="block text-sm font-medium text-ink">Enter the 6-digit code sent to +91 {phone}</label>
          <div className="flex gap-2">
            <input
              id={`otp-${role}-${purpose}`}
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={`${inputClass(false)} max-w-[180px] text-center text-lg tracking-[0.4em]`}
            />
            <button type="button" onClick={verify} disabled={code.length !== 6 || busy} className={`min-h-[44px] px-4 text-sm font-semibold disabled:opacity-50 ${btn}`}>
              {busy ? 'Checking…' : 'Verify'}
            </button>
          </div>
          {devCode && <p className="text-xs text-amber-800">Development mode: your code is <strong className="tracking-widest">{devCode}</strong></p>}
          <div className="flex flex-wrap gap-4 text-sm">
            <button type="button" onClick={send} disabled={cooldown > 0 || busy} className="font-medium text-ink underline decoration-lemon decoration-2 underline-offset-4 hover:decoration-ink disabled:text-sage-soft disabled:no-underline">
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
            <button type="button" onClick={() => { setStage('enter'); setError('') }} className="font-medium text-sage hover:underline">Change number</button>
          </div>
        </form>
      )}
      <Notice>{error}</Notice>
    </div>
  )
}
