'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiMapPin } from 'react-icons/fi'
import { BrandLockup } from '@/shared/brand/Logo'
import PhoneVerify from '@/shared/ui/PhoneVerify'
import WeeklyHours, { hoursProblem } from '@/shared/ui/WeeklyHours'
import { Checkbox, ChipGroup, Notice, Select, TextArea, TextInput } from '@/shared/ui/Form'
import { PageLoader } from '@/shared/ui/Card'
import { api, setSession } from '@/shared/lib/api'
import { useMasters } from '@/shared/lib/useMasters'
import { classLabel, MODE_LABELS } from '@/shared/lib/format'
import { TUTOR_API } from '@/features/tutor/api/endpoints'

// Tutor registration (blueprint Appendix B). Documents are uploaded from the dashboard after
// the account exists, so a failed upload never loses the form.
const STEPS = ['Personal', 'Teaching', 'Availability', 'Profile']
const STEP_FIELDS = [
  ['name', 'phone', 'phoneToken', 'email', 'gender', 'dob', 'address', 'pincode', 'latitude'],
  ['qualification', 'college', 'experienceYears', 'subjects', 'classes', 'boards', 'languages', 'modes'],
  ['serviceRadiusKm', 'availability', 'feeMin', 'feeMax', 'demoAvailable'],
  ['bio', 'teachingMethod', 'achievements', 'consent.terms', 'consent.communication', 'consent.location'],
]

const primary = 'inline-flex min-h-[48px] items-center justify-center rounded-full border border-ink bg-lemon px-6 font-semibold text-ink hover:bg-[#f2e04f] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2'
const secondary = 'inline-flex min-h-[48px] items-center justify-center rounded-full border border-ink/25 bg-white px-6 font-semibold text-ink hover:bg-mint/50'

function validateStep(step, f) {
  const e = {}
  if (step === 0) {
    if (!f.name || f.name.trim().length < 2) e.name = 'Enter your full name'
    if (!f.phoneToken) e.phone = 'Verify your mobile number'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email || '')) e.email = 'Enter a valid email'
    if (!f.gender) e.gender = 'Choose an option'
    if (!f.address || f.address.trim().length < 5) e.address = 'Enter your address'
    if (!/^[1-9]\d{5}$/.test(f.pincode || '')) e.pincode = 'Enter a 6-digit pincode'
  }
  if (step === 1) {
    if (!f.qualification) e.qualification = 'Choose your highest qualification'
    if (f.experienceYears === '' || Number(f.experienceYears) < 0 || Number(f.experienceYears) > 50) e.experienceYears = 'Enter 0 to 50 years'
    for (const [k, label] of [['subjects', 'subject'], ['classes', 'class'], ['boards', 'board'], ['languages', 'language'], ['modes', 'teaching mode']]) {
      if (f[k].length === 0) e[k] = `Choose at least one ${label}`
    }
  }
  if (step === 2) {
    const hours = hoursProblem(f.availability)
    if (hours) e.availability = hours
    if (f.modes.includes('home') && !(Number(f.serviceRadiusKm) >= 1 && Number(f.serviceRadiusKm) <= 50)) e.serviceRadiusKm = 'Enter 1 to 50 km'
    if (f.feeMin && f.feeMax && Number(f.feeMin) > Number(f.feeMax)) e.feeMax = 'Must be at least the minimum'
  }
  if (step === 3) {
    if (f.bio.trim().length < 50) e.bio = `Write at least 50 characters (${f.bio.trim().length} so far)`
    if (!f.consent.terms) e['consent.terms'] = 'Please accept the tutor terms'
    if (!f.consent.communication) e['consent.communication'] = 'We need permission to send you lead offers'
    if (f.latitude !== undefined && !f.consent.location) e['consent.location'] = 'Allow us to use the location you shared, or remove it'
  }
  return e
}

export default function TutorRegisterPage() {
  const router = useRouter()
  const { masters, error: mastersError } = useMasters()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)
  const [locating, setLocating] = useState(false)
  const [done, setDone] = useState(false)
  const [f, setF] = useState({
    name: '', phone: '', phoneToken: '', email: '', gender: '', dob: '', address: '', pincode: '', latitude: undefined, longitude: undefined,
    qualification: '', college: '', experienceYears: '', subjects: [], classes: [], boards: [], languages: [], modes: [],
    serviceRadiusKm: 8, availability: [], feeMin: '', feeMax: '', demoAvailable: true,
    bio: '', teachingMethod: '', achievements: '', consent: { terms: false, communication: false, location: false },
  })
  // Changing a field clears its error, so fixed problems do not linger until the next step.
  const set = (key, value) => {
    setF(prev => ({ ...prev, [key]: value }))
    const stale = k => k === key || k.startsWith(`${key}.`)
    setErrors(prev => (Object.keys(prev).some(stale) ? Object.fromEntries(Object.entries(prev).filter(([k]) => !stale(k))) : prev))
  }
  const maxDob = useMemo(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().slice(0, 10) }, [])

  const next = () => {
    const e = validateStep(step, f)
    setErrors(e)
    if (Object.keys(e).length === 0) { setStep(s => s + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setF(p => ({ ...p, latitude: Math.round(pos.coords.latitude * 1e6) / 1e6, longitude: Math.round(pos.coords.longitude * 1e6) / 1e6, consent: { ...p.consent, location: true } }))
        setLocating(false)
      },
      () => { setLocating(false); setErrors(e => ({ ...e, address: 'We could not get your location. Your address will be used instead.' })) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function submit() {
    const e = validateStep(3, f)
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true); setServerError('')
    const opt = (k, v) => (v === '' || v === undefined ? {} : { [k]: v })
    const body = {
      phoneToken: f.phoneToken, name: f.name.trim(), phone: f.phone, email: f.email.trim(), gender: f.gender, ...opt('dob', f.dob),
      address: f.address.trim(), pincode: f.pincode, ...(f.latitude !== undefined ? { latitude: f.latitude, longitude: f.longitude } : {}),
      qualification: f.qualification, ...opt('college', f.college), experienceYears: Number(f.experienceYears),
      subjects: f.subjects, classes: f.classes, boards: f.boards, languages: f.languages, modes: f.modes,
      serviceRadiusKm: Number(f.serviceRadiusKm) || 8, availability: f.availability,
      ...opt('feeMin', f.feeMin === '' ? '' : Number(f.feeMin)), ...opt('feeMax', f.feeMax === '' ? '' : Number(f.feeMax)),
      demoAvailable: f.demoAvailable, bio: f.bio.trim(), ...opt('teachingMethod', f.teachingMethod), ...opt('achievements', f.achievements),
      consent: { terms: true, communication: true, ...(f.latitude !== undefined ? { location: true } : {}) },
    }
    try {
      const res = await api(TUTOR_API.register, { method: 'POST', body })
      setSession('tutor', { token: res.token, user: res.tutor })
      setDone(true)
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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700" aria-hidden="true">✓</div>
          <h1 className="text-2xl font-bold text-ink">You&apos;re registered</h1>
          <p className="mt-2 text-sage">Next, upload your photo, identity document and qualification certificate. We review them before you can receive leads.</p>
          <button type="button" onClick={() => router.push('/tutor/dashboard?tab=verification')} className={`${primary} mt-6 w-full`}>Upload documents</button>
        </div>
      </div>
    )
  }

  const dayOptions = masters.days
  return (
    <div className="min-h-screen bg-ivory px-4 font-landing text-ink pb-16 pt-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <Link href="/" className="mb-6 flex justify-center"><BrandLockup className="h-20 w-auto" /></Link>
          <h1 className="text-3xl font-bold text-ink sm:text-4xl">Teach with us</h1>
          <p className="mt-2 text-sage">Get matched with students near you and online.</p>
        </div>

        <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Progress">
          {STEPS.map((label, i) => (
            <li key={label} aria-current={i === step ? 'step' : undefined}>
              <div className={`h-2 rounded-full ${i <= step ? 'bg-ink' : 'bg-ink/15'}`} />
              <p className={`mt-1.5 hidden text-xs sm:block ${i === step ? 'font-semibold text-ink' : 'text-sage'}`}>{i + 1}. {label}</p>
            </li>
          ))}
        </ol>
        <p className="mb-3 text-sm font-semibold sm:hidden">Step {step + 1} of 4: {STEPS[step]}</p>

        <div className="space-y-5 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-8">
          {step === 0 && (
            <>
              <h2 className="text-xl font-bold text-ink">Personal details</h2>
              <TextInput label="Full name" required autoComplete="name" value={f.name} onChange={e => set('name', e.target.value)} error={errors.name} />
              <PhoneVerify role="tutor" purpose="register" phone={f.phone} onPhoneChange={v => setF(p => ({ ...p, phone: v, phoneToken: '' }))} verified={!!f.phoneToken} onVerified={({ phoneToken }) => set('phoneToken', phoneToken)} />
              {errors.phone && <p role="alert" className="-mt-3 text-xs font-medium text-red-600">{errors.phone}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Email" required type="email" autoComplete="email" value={f.email} onChange={e => set('email', e.target.value)} error={errors.email} />
                <TextInput label="Date of birth" type="date" max={maxDob} hint="Optional" value={f.dob} onChange={e => set('dob', e.target.value)} />
              </div>
              <ChipGroup label="Gender" required single options={masters.genders} value={f.gender} onChange={v => set('gender', v)} error={errors.gender} />
              <TextArea label="Current address" required rows={2} autoComplete="street-address" value={f.address} onChange={e => set('address', e.target.value)} error={errors.address}
                hint="Used to match you with nearby students. Parents never see your address." />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Pincode" required inputMode="numeric" maxLength={6} value={f.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))} error={errors.pincode} />
                <div className="flex items-end">
                  <button type="button" onClick={useMyLocation} disabled={locating} className={`${secondary} w-full gap-2 text-sm`}>
                    <FiMapPin className="h-4 w-4" aria-hidden="true" /> {locating ? 'Locating…' : f.latitude !== undefined ? 'Location added ✓' : 'Use my current location'}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-ink">What you teach</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Highest qualification" required options={masters.qualifications} value={f.qualification} onChange={e => set('qualification', e.target.value)} error={errors.qualification} />
                <TextInput label="Years of teaching experience" required type="number" min={0} max={50} inputMode="numeric" value={f.experienceYears} onChange={e => set('experienceYears', e.target.value)} error={errors.experienceYears} />
              </div>
              <TextInput label="College / university" hint="Optional" value={f.college} onChange={e => set('college', e.target.value)} />
              <ChipGroup label="Subjects" required options={masters.subjects} value={f.subjects} onChange={v => set('subjects', v)} error={errors.subjects} />
              <ChipGroup label="Classes" required options={masters.classes.map(c => ({ value: c, label: classLabel(c) }))} value={f.classes} onChange={v => set('classes', v)} error={errors.classes} />
              <ChipGroup label="Boards" required options={masters.boards} value={f.boards} onChange={v => set('boards', v)} error={errors.boards} />
              <ChipGroup label="Teaching languages" required options={masters.languages} value={f.languages} onChange={v => set('languages', v)} error={errors.languages} />
              <ChipGroup label="Teaching mode" required options={masters.tutorModes.map(m => ({ value: m, label: m === 'home' ? "At the student's home" : 'Online' }))} value={f.modes} onChange={v => set('modes', v)} error={errors.modes} />
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-ink">When and where</h2>
              {f.modes.includes('home') && (
                <TextInput label="How far will you travel for home tuition? (km)" type="number" min={1} max={50} value={f.serviceRadiusKm} onChange={e => set('serviceRadiusKm', e.target.value)} error={errors.serviceRadiusKm}
                  hint="You will only receive home leads within this distance." />
              )}
              <WeeklyHours days={dayOptions} value={f.availability} onChange={v => set('availability', v)} error={errors.availability} hint="Turn on the days you can teach and set your usual hours. You can add holidays later from your dashboard." />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Expected fee from (₹ / month)" type="number" min={0} inputMode="numeric" hint="Optional" value={f.feeMin} onChange={e => set('feeMin', e.target.value)} />
                <TextInput label="Expected fee up to (₹ / month)" type="number" min={0} inputMode="numeric" value={f.feeMax} onChange={e => set('feeMax', e.target.value)} error={errors.feeMax} />
              </div>
              <Checkbox checked={f.demoAvailable} onChange={v => set('demoAvailable', v)} label="I can give a free demo class before a parent decides" />
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-bold text-ink">Your profile</h2>
              <TextArea label="About you" required rows={5} maxLength={1000} value={f.bio} onChange={e => set('bio', e.target.value)} error={errors.bio}
                hint="Parents read this. Mention your experience, approach and what students achieve with you (50–1000 characters)." />
              <TextArea label="Teaching method" hint="Optional" maxLength={1000} value={f.teachingMethod} onChange={e => set('teachingMethod', e.target.value)} />
              <TextArea label="Achievements" hint="Optional" maxLength={1000} value={f.achievements} onChange={e => set('achievements', e.target.value)} />
              <div className="rounded-xl bg-sand-50 p-4 text-sm">
                <p className="font-semibold text-ink">Summary</p>
                <p className="mt-1 text-sage">{f.subjects.join(', ')} · {f.classes.map(classLabel).join(', ')} · {f.modes.map(m => MODE_LABELS[m]).join(' & ')} · {new Set(f.availability.map(r => r.day)).size} teaching day(s) a week</p>
              </div>
              <fieldset className="space-y-3">
                <legend className="sr-only">Consent</legend>
                <Checkbox checked={f.consent.terms} onChange={v => set('consent', { ...f.consent, terms: v })} error={errors['consent.terms']}>
                  I accept the <a href="#" className="underline">tutor terms</a> and <a href="#" className="underline">privacy policy</a>, and confirm my details are true.
                </Checkbox>
                <Checkbox checked={f.consent.communication} onChange={v => set('consent', { ...f.consent, communication: v })} error={errors['consent.communication']}
                  label="You may send me lead offers and updates by phone, WhatsApp, SMS and email." />
                {f.latitude !== undefined && (
                  <Checkbox checked={f.consent.location} onChange={v => set('consent', { ...f.consent, location: v })} error={errors['consent.location']}
                    label="You may use the location I shared for matching." />
                )}
              </fieldset>
            </>
          )}

          <Notice>{serverError}</Notice>

          <div className="flex flex-col-reverse gap-3 border-t border-sand-100 pt-5 sm:flex-row sm:justify-between">
            {step > 0 ? <button type="button" onClick={() => setStep(s => s - 1)} className={secondary}>Back</button> : <span />}
            {step < 3
              ? <button type="button" onClick={next} className={primary}>Continue</button>
              : <button type="button" onClick={submit} disabled={busy} className={primary}>{busy ? 'Registering…' : 'Create tutor account'}</button>}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-sage">
          Already registered? <Link href="/login?role=tutor" className="font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-4 hover:decoration-ink">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
