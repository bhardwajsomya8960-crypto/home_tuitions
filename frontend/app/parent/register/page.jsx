'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FiMapPin, FiEdit2 } from 'react-icons/fi'
import Logo from '../../../components/landing/Logo'
import PhoneVerify from '../../../components/ui/PhoneVerify'
import { Checkbox, ChipGroup, Notice, Select, TextArea, TextInput } from '../../../components/ui/Form'
import { PageLoader } from '../../../components/ui/Card'
import { api, setSession } from '../../../lib/api'
import { useMasters, optionLabel } from '../../../lib/useMasters'
import { classLabel, DAY_LABELS, daysText, MODE_LABELS, slotsText } from '../../../lib/format'

const STEPS = ['Your details', 'Student', 'Tuition needs', 'Review']
const STEP_FIELDS = [
  ['name', 'phone', 'phoneToken', 'email', 'relationship'],
  ['studentName', 'studentClass', 'board', 'subjects', 'school'],
  ['mode', 'address', 'pincode', 'latitude', 'preferredDays', 'preferredSlots', 'budgetRange', 'startDate', 'urgency', 'prefGender', 'prefLanguages', 'specialRequirements'],
  ['consent.terms', 'consent.communication', 'consent.location'],
]

const primary = 'inline-flex min-h-[48px] items-center justify-center rounded-full border border-ink bg-lemon px-6 font-semibold text-ink hover:bg-[#f2e04f] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2'
const secondary = 'inline-flex min-h-[48px] items-center justify-center rounded-full border border-ink/25 bg-white px-6 font-semibold text-ink hover:bg-mint/50'

function validateStep(step, f) {
  const e = {}
  if (step === 0) {
    if (!f.name || f.name.trim().length < 2) e.name = 'Enter your full name'
    if (!f.phoneToken) e.phone = 'Verify your mobile number'
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) e.email = 'Enter a valid email or leave it blank'
    if (!f.relationship) e.relationship = 'Choose your relationship to the student'
  }
  if (step === 1) {
    if (!f.studentName || f.studentName.trim().length < 2) e.studentName = "Enter the student's name"
    if (!f.studentClass) e.studentClass = 'Choose a class'
    if (!f.board) e.board = 'Choose a board'
    if (f.subjects.length === 0) e.subjects = 'Choose at least one subject'
  }
  if (step === 2) {
    if (!f.mode) e.mode = 'Choose home, online or hybrid'
    if (f.mode !== 'online') {
      if (!f.address || f.address.trim().length < 5) e.address = 'Enter the address where classes will happen'
      if (!/^[1-9]\d{5}$/.test(f.pincode || '')) e.pincode = 'Enter a 6-digit pincode'
    }
    if (f.preferredDays.length === 0) e.preferredDays = 'Choose at least one day'
    if (f.preferredSlots.length === 0) e.preferredSlots = 'Choose at least one time'
  }
  if (step === 3) {
    if (!f.consent.terms) e['consent.terms'] = 'Please accept the terms and privacy policy'
    if (!f.consent.communication) e['consent.communication'] = 'We need permission to contact you about this request'
    if (f.latitude !== undefined && !f.consent.location) e['consent.location'] = 'Allow us to use the location you shared, or remove it'
  }
  return e
}

function ParentRegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { masters, error: mastersError } = useMasters()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)
  const [locating, setLocating] = useState(false)
  const [done, setDone] = useState(null)
  const [f, setF] = useState({
    name: '', phone: '', phoneToken: '', email: '', relationship: '',
    studentName: '', studentClass: '', board: '', subjects: [], school: '',
    mode: '', address: '', pincode: '', latitude: undefined, longitude: undefined,
    preferredDays: [], preferredSlots: [], budgetRange: '', startDate: '', urgency: '', prefGender: '', prefLanguages: [], specialRequirements: '',
    consent: { terms: false, communication: false, location: false },
  })
  // Changing a field clears its error, so fixed problems do not linger until the next step.
  const set = (key, value) => {
    setF(prev => ({ ...prev, [key]: value }))
    const stale = k => k === key || k.startsWith(`${key}.`)
    setErrors(prev => (Object.keys(prev).some(stale) ? Object.fromEntries(Object.entries(prev).filter(([k]) => !stale(k))) : prev))
  }

  // ?mode=Home|Online|Hybrid from the landing page; ?course=<slug> from a course page.
  const course = params.get('course')
  useEffect(() => {
    const mode = (params.get('mode') || '').toLowerCase()
    if (['home', 'online', 'hybrid'].includes(mode)) set('mode', mode)
  }, [params])

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const next = () => {
    const e = validateStep(step, f)
    setErrors(e)
    if (Object.keys(e).length === 0) { setStep(s => s + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setErrors(e => ({ ...e, address: 'Location is not available on this device' }))
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setF(prev => ({ ...prev, latitude: Math.round(pos.coords.latitude * 1e6) / 1e6, longitude: Math.round(pos.coords.longitude * 1e6) / 1e6, consent: { ...prev.consent, location: true } }))
        setLocating(false)
      },
      () => { setLocating(false); setErrors(e => ({ ...e, address: 'We could not get your location. Enter the address instead.' })) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function submit() {
    const e = validateStep(3, f)
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true); setServerError('')
    const online = f.mode === 'online'
    const body = {
      phoneToken: f.phoneToken, name: f.name.trim(), phone: f.phone, relationship: f.relationship,
      ...(f.email ? { email: f.email.trim() } : {}),
      studentName: f.studentName.trim(), studentClass: f.studentClass, board: f.board, subjects: f.subjects,
      ...(f.school ? { school: f.school } : {}),
      mode: f.mode, preferredDays: f.preferredDays, preferredSlots: f.preferredSlots,
      ...(!online || f.address ? { address: f.address } : {}),
      ...(!online || f.pincode ? { pincode: f.pincode } : {}),
      ...(f.latitude !== undefined && !online ? { latitude: f.latitude, longitude: f.longitude } : {}),
      ...(f.budgetRange ? { budgetRange: f.budgetRange } : {}),
      ...(f.startDate ? { startDate: f.startDate } : {}),
      ...(f.urgency ? { urgency: f.urgency } : {}),
      ...(f.prefGender ? { prefGender: f.prefGender } : {}),
      ...(f.prefLanguages.length ? { prefLanguages: f.prefLanguages } : {}),
      ...(f.specialRequirements ? { specialRequirements: f.specialRequirements } : {}),
      ...(course ? { courseSlug: course } : {}),
      source: params.get('utm_source') && masters.leadSources.includes(params.get('utm_source')) ? params.get('utm_source') : 'website',
      consent: { terms: true, communication: true, ...(f.latitude !== undefined && !online ? { location: true } : {}) },
    }
    if (!body.address) delete body.address
    if (!body.pincode) delete body.pincode
    try {
      const res = await api('/api/parents/register', { method: 'POST', body })
      setSession('parent', { token: res.token, user: res.parent })
      setDone(res)
    } catch (err) {
      const fieldErrors = err.fieldErrors ? err.fieldErrors() : {}
      setErrors(fieldErrors)
      setServerError(err.message)
      const firstStep = STEP_FIELDS.findIndex(fields => fields.some(k => fieldErrors[k]))
      if (firstStep >= 0 && firstStep < 3) setStep(firstStep)
    } finally {
      setBusy(false)
    }
  }

  if (mastersError) return <div className="mx-auto max-w-md p-8"><Notice>We could not load the form. Check your connection and refresh.</Notice></div>
  if (!masters) return <PageLoader label="Loading form…" />

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory p-4 font-landing text-ink">
        <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mint text-2xl" aria-hidden="true">✓</div>
          <h1 className="text-2xl font-bold">Request received</h1>
          <p className="mt-2 text-sage">Your request number is <strong>{done.lead.code}</strong>. Our team will confirm the details and start looking for tutors near you.</p>
          <button type="button" onClick={() => router.push('/parent/dashboard')} className={`${primary} mt-6 w-full`}>Go to my dashboard</button>
        </div>
      </div>
    )
  }

  const slotOptions = masters.slots
  const dayOptions = masters.days.map(d => ({ value: d, label: DAY_LABELS[d] }))
  const Section = ({ index, title, rows }) => (
    <div className="rounded-xl border border-sand-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <button type="button" onClick={() => setStep(index)} className="inline-flex min-h-[40px] items-center gap-1 text-sm font-semibold text-ink underline-offset-2 hover:underline"><FiEdit2 className="h-4 w-4" aria-hidden="true" /> Edit</button>
      </div>
      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="text-xs text-sage">{k}</dt><dd className="font-medium">{v}</dd></div>)}
      </dl>
    </div>
  )

  return (
    <div className="min-h-screen bg-ivory px-4 pb-16 pt-8 font-landing text-ink">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5"><Logo /><span className="text-lg font-bold">Home Tuition</span></Link>
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Find a tutor for your child</h1>
          <p className="mt-2 text-sage">Four short steps. It takes about three minutes.</p>
        </div>

        <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Progress">
          {STEPS.map((label, i) => (
            <li key={label} aria-current={i === step ? 'step' : undefined}>
              <div className={`h-2 rounded-full ${i <= step ? 'bg-ink' : 'bg-ink/15'}`} />
              <p className={`mt-1.5 hidden text-xs sm:block ${i === step ? 'font-semibold' : 'text-sage'}`}>{i + 1}. {label}</p>
            </li>
          ))}
        </ol>
        <p className="mb-3 text-sm font-semibold sm:hidden">Step {step + 1} of 4: {STEPS[step]}</p>

        {course && <div className="mb-4"><Notice tone="info">You are enquiring about the course <strong>{course.replace(/-/g, ' ')}</strong>.</Notice></div>}

        <div className="space-y-5 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-8">
          {step === 0 && (
            <>
              <h2 className="text-xl font-bold">Your details</h2>
              <TextInput label="Full name" required autoComplete="name" value={f.name} onChange={e => set('name', e.target.value)} error={errors.name} />
              <PhoneVerify role="parent" purpose="register" phone={f.phone} onPhoneChange={v => setF(p => ({ ...p, phone: v, phoneToken: '' }))} verified={!!f.phoneToken} onVerified={({ phoneToken }) => set('phoneToken', phoneToken)} />
              {errors.phone && <p role="alert" className="-mt-3 text-xs font-medium text-red-600">{errors.phone}</p>}
              <TextInput label="Email" type="email" autoComplete="email" hint="Optional. For receipts and updates." value={f.email} onChange={e => set('email', e.target.value)} error={errors.email} />
              <ChipGroup label="Relationship to the student" required single options={masters.relationships} value={f.relationship} onChange={v => set('relationship', v)} error={errors.relationship} />
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-bold">About the student</h2>
              <TextInput label="Student's name" required value={f.studentName} onChange={e => set('studentName', e.target.value)} error={errors.studentName} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Class / grade" required options={masters.classes.map(c => ({ value: c, label: classLabel(c) }))} value={f.studentClass} onChange={e => set('studentClass', e.target.value)} error={errors.studentClass} />
                <Select label="Board" required options={masters.boards} value={f.board} onChange={e => set('board', e.target.value)} error={errors.board} />
              </div>
              <ChipGroup label="Subjects" required hint="Choose all that apply" options={masters.subjects} value={f.subjects} onChange={v => set('subjects', v)} error={errors.subjects} />
              <TextInput label="Current school" hint="Optional" value={f.school} onChange={e => set('school', e.target.value)} />
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold">Tuition needs</h2>
              <ChipGroup label="Learning mode" required single options={masters.leadModes.map(m => ({ value: m, label: MODE_LABELS[m] }))} value={f.mode} onChange={v => set('mode', v)} error={errors.mode}
                hint={f.mode === 'hybrid' ? 'Some classes at home, some online' : undefined} />
              {f.mode && f.mode !== 'online' && (
                <div className="space-y-4 rounded-xl bg-ivory p-4">
                  <TextArea label="Address where classes will happen" required rows={2} autoComplete="street-address" value={f.address} onChange={e => set('address', e.target.value)} error={errors.address}
                    hint="Tutors see only your pincode until you approve them." />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextInput label="Pincode" required inputMode="numeric" maxLength={6} autoComplete="postal-code" value={f.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))} error={errors.pincode} />
                    <div className="flex items-end">
                      <button type="button" onClick={useMyLocation} disabled={locating} className={`${secondary} w-full gap-2 text-sm`}>
                        <FiMapPin className="h-4 w-4" aria-hidden="true" /> {locating ? 'Locating…' : f.latitude !== undefined ? 'Location added ✓' : 'Use my current location'}
                      </button>
                    </div>
                  </div>
                  {f.latitude !== undefined && (
                    <p className="text-xs text-sage">We'll use this location only to find tutors near you. <button type="button" className="font-semibold underline" onClick={() => setF(p => ({ ...p, latitude: undefined, longitude: undefined, consent: { ...p.consent, location: false } }))}>Remove</button></p>
                  )}
                </div>
              )}
              <ChipGroup label="Preferred days" required options={dayOptions} value={f.preferredDays} onChange={v => set('preferredDays', v)} error={errors.preferredDays} />
              <ChipGroup label="Preferred times" required options={slotOptions} value={f.preferredSlots} onChange={v => set('preferredSlots', v)} error={errors.preferredSlots} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Monthly budget" options={masters.budgetRanges} value={f.budgetRange} onChange={e => set('budgetRange', e.target.value)} placeholder="Not sure yet" />
                <Select label="How soon?" options={masters.urgency} value={f.urgency} onChange={e => set('urgency', e.target.value)} placeholder="No rush" />
                <TextInput label="Preferred start date" type="date" min={today} value={f.startDate} onChange={e => set('startDate', e.target.value)} />
                <Select label="Tutor gender preference" options={['No preference', 'Female', 'Male']} value={f.prefGender} onChange={e => set('prefGender', e.target.value)} placeholder="No preference" />
              </div>
              <ChipGroup label="Tutor language preference" hint="Optional" options={masters.languages} value={f.prefLanguages} onChange={v => set('prefLanguages', v)} />
              <TextArea label="Anything else the tutor should know?" hint="Optional: learning needs, exam goals, timings" maxLength={1000} value={f.specialRequirements} onChange={e => set('specialRequirements', e.target.value)} />
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-bold">Check and submit</h2>
              <Section index={0} title="Your details" rows={[['Name', f.name], ['Mobile', `+91 ${f.phone}`], ['Email', f.email], ['Relationship', f.relationship]]} />
              <Section index={1} title="Student" rows={[['Name', f.studentName], ['Class', classLabel(f.studentClass)], ['Board', f.board], ['Subjects', f.subjects.join(', ')], ['School', f.school]]} />
              <Section index={2} title="Tuition needs" rows={[
                ['Mode', MODE_LABELS[f.mode]], ['Address', f.mode !== 'online' ? `${f.address}, ${f.pincode}` : ''], ['Location', f.latitude !== undefined && f.mode !== 'online' ? 'Shared from this device' : ''],
                ['Days', daysText(f.preferredDays)], ['Times', slotsText(f.preferredSlots)], ['Budget', optionLabel(masters.budgetRanges, f.budgetRange)],
                ['Start', f.startDate], ['How soon', optionLabel(masters.urgency, f.urgency)], ['Tutor gender', f.prefGender], ['Languages', f.prefLanguages.join(', ')], ['Notes', f.specialRequirements],
              ]} />
              <fieldset className="space-y-3 rounded-xl bg-ivory p-4">
                <legend className="sr-only">Consent</legend>
                <Checkbox checked={f.consent.terms} onChange={v => set('consent', { ...f.consent, terms: v })} error={errors['consent.terms']}>
                  I accept the <a href="#" className="underline">terms of service</a> and <a href="#" className="underline">privacy policy</a>.
                </Checkbox>
                <Checkbox checked={f.consent.communication} onChange={v => set('consent', { ...f.consent, communication: v })} error={errors['consent.communication']}
                  label="You may contact me by phone, WhatsApp, SMS and email about this request." />
                {f.latitude !== undefined && f.mode !== 'online' && (
                  <Checkbox checked={f.consent.location} onChange={v => set('consent', { ...f.consent, location: v })} error={errors['consent.location']}
                    label="You may use the location I shared to find tutors near me." />
                )}
              </fieldset>
            </>
          )}

          <Notice>{serverError}</Notice>

          <div className="flex flex-col-reverse gap-3 border-t border-sand-100 pt-5 sm:flex-row sm:justify-between">
            {step > 0 ? <button type="button" onClick={() => setStep(s => s - 1)} className={secondary}>Back</button> : <span />}
            {step < 3
              ? <button type="button" onClick={next} className={primary}>Continue</button>
              : <button type="button" onClick={submit} disabled={busy} className={primary}>{busy ? 'Submitting…' : 'Submit request'}</button>}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-sage">
          Already registered? <Link href="/login?role=parent" className="font-semibold text-ink underline decoration-lemon decoration-4 underline-offset-4">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default function ParentRegisterPage() {
  return (
    <Suspense fallback={null}>
      <ParentRegisterForm />
    </Suspense>
  )
}
