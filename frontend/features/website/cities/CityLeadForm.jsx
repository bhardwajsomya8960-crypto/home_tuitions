'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { FaWhatsapp } from 'react-icons/fa'
import { FiCheckCircle } from 'react-icons/fi'
import { Checkbox, ChipGroup, Notice, Select, TextInput } from '@/shared/ui/Form'
import { sendEnquiry } from '@/features/website/api/enquiryApi'
import { trackContact, trackLead } from '@/shared/lib/tracking'
import { CLASS_OPTIONS, MODE_OPTIONS, SUBJECT_OPTIONS, TIME_OPTIONS, labelOf } from './leadOptions'

const OTHER = '__other'
const PHONE_ERROR = 'Enter a 10-digit mobile number starting with 6, 7, 8 or 9.'

// Accepts what people type or paste: 98765 43210, +91 98765 43210, 098765-43210.
export function normalisePhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return digits
}

const primaryBtn = 'inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-ink bg-lemon px-7 text-base font-semibold text-ink shadow-[0_1px_0_rgba(38,53,47,0.9)] hover:bg-[#f2e04f] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2'
const whatsappBtn = 'inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-ink bg-[#25D366] px-7 text-base font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 sm:w-auto'

// The city page's callback form. It posts to the same email route as the homepage form
// (features/website/api/enquiryApi.js → app/api/notify/enquiry), adding the city, area,
// the page it was sent from and the visit's UTM parameters.
export default function CityLeadForm({ citySlug, cityName, areas, defaultArea = '', homeTuitionAvailable, whatsappDigits }) {
  const pathname = usePathname()
  const modes = homeTuitionAvailable ? MODE_OPTIONS : MODE_OPTIONS.filter(m => m.value === 'online')
  const blank = { name: '', phone: '', area: defaultArea, areaOther: '', classLevel: '', subjects: [], mode: modes[0].value, time: '', female: false }
  const [f, setF] = useState(blank)
  const [phoneError, setPhoneError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(null)
  const formRef = useRef(null)
  const thanksRef = useRef(null)
  const set = (key, value) => setF(prev => ({ ...prev, [key]: value }))

  // Move focus to the thank-you message so keyboard and screen reader users hear the result.
  useEffect(() => { if (sent) thanksRef.current?.focus() }, [sent])

  const areaValue = f.area === OTHER ? (f.areaOther.trim() ? `Other: ${f.areaOther.trim()}` : 'Other') : f.area

  async function submit(e) {
    e.preventDefault()
    setError('')
    const phone = normalisePhone(f.phone)
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setPhoneError(PHONE_ERROR)
      formRef.current?.querySelector('input[type="tel"]')?.focus()
      return
    }
    setPhoneError('')
    setBusy(true)
    const body = {
      kind: 'parent',
      role: 'parent',
      phone,
      name: f.name.trim(),
      city: citySlug,
      area: areaValue,
      class_level: f.classLevel,
      subjects: f.subjects,
      mode: f.mode,
      preferred_time: f.time,
      female_tutor: f.female,
      source_page: pathname,
    }
    try {
      await sendEnquiry(body)
      trackLead({ city: cityName, area: areaValue })
      setSent({ phone, area: areaValue, classLevel: labelOf(CLASS_OPTIONS, f.classLevel), subjects: f.subjects.map(s => labelOf(SUBJECT_OPTIONS, s)).join(', ') })
      setF(blank)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    const text = `Hi, I just requested a callback on your website. I need ${homeTuitionAvailable ? 'a home tutor' : 'an online tutor'} in ${cityName}. Class: ${sent.classLevel || '__'}, Subject: ${sent.subjects || '__'}, Area: ${sent.area || '__'}`
    return (
      <div className="flex flex-col items-start gap-4 py-4" role="status">
        <FiCheckCircle className="h-10 w-10 text-green-700" aria-hidden="true" />
        <h3 ref={thanksRef} tabIndex={-1} className="text-2xl font-bold text-ink focus:outline-none">Thank you! We&apos;ll call you on +91 {sent.phone} soon.</h3>
        <p className="text-sage">Want to move faster? Send us your details on WhatsApp now and we&apos;ll reply there.</p>
        <a href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"
          onClick={() => trackContact({ city: cityName, area: sent.area, method: 'whatsapp' })} className={whatsappBtn}>
          <FaWhatsapp className="h-5 w-5" aria-hidden="true" /> Continue on WhatsApp
        </a>
        <button type="button" onClick={() => setSent(null)} className="font-semibold text-ink underline decoration-lemon decoration-4 underline-offset-4">
          Send another request
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput label="Parent name" hint="Optional" autoComplete="name" maxLength={80} value={f.name} onChange={e => set('name', e.target.value)} />
        <TextInput label="Mobile number" required type="tel" inputMode="tel" autoComplete="tel-national" maxLength={16}
          placeholder="10-digit mobile number" value={f.phone} error={phoneError}
          onChange={e => { set('phone', e.target.value.replace(/[^\d+\s-]/g, '')); setPhoneError('') }}
          onBlur={() => { if (f.phone && !/^[6-9]\d{9}$/.test(normalisePhone(f.phone))) setPhoneError(PHONE_ERROR) }} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-3">
          <Select label="Area" hint="Optional" placeholder="Choose your area…" value={f.area} onChange={e => set('area', e.target.value)}
            options={[...areas.map(name => ({ value: name, label: name })), { value: OTHER, label: 'Other' }]} />
          {f.area === OTHER && (
            <TextInput label="Your area" hint="Optional" maxLength={60} value={f.areaOther} onChange={e => set('areaOther', e.target.value)} placeholder={`Locality in ${cityName}`} />
          )}
        </div>
        <Select label="Class" hint="Optional" placeholder="Choose class…" options={CLASS_OPTIONS} value={f.classLevel} onChange={e => set('classLevel', e.target.value)} />
      </div>

      <ChipGroup label="Subjects" hint="Optional. Choose any that apply." options={SUBJECT_OPTIONS} value={f.subjects} onChange={v => set('subjects', v)} />

      <div className="grid gap-5 sm:grid-cols-2">
        <ChipGroup single label="Preferred mode" options={modes} value={f.mode} onChange={v => set('mode', v || modes[0].value)} />
        <ChipGroup single label="Preferred time" hint="Optional" options={TIME_OPTIONS} value={f.time} onChange={v => set('time', v)} />
      </div>

      <Checkbox label="I would prefer a female tutor" checked={f.female} onChange={v => set('female', v)} />

      <Notice>{error}</Notice>
      <button type="submit" className={primaryBtn} disabled={busy}>{busy ? 'Sending…' : 'Request a Callback'}</button>
      <p className="text-sm text-sage">We never share your number.</p>
    </form>
  )
}
