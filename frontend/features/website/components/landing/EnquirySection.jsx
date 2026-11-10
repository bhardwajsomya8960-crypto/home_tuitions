'use client'

import { useEffect, useState } from 'react'
import { FiCheckCircle, FiMail, FiMessageCircle, FiPhone } from 'react-icons/fi'
import { Notice, Select, TextArea, TextInput } from '@/shared/ui/Form'
import { CONTACT, hasContact } from '@/features/website/contact'
import { sendEnquiry } from '@/features/website/api/enquiryApi'
import { ENQUIRY_LEVELS } from '@/features/website/enquiryLevels'

const TABS = [
  { id: 'parent', label: 'I need a tutor', hash: '#enquire' },
  { id: 'tutor', label: 'I want to teach', hash: '#enquire-tutor' },
]
const blank = { phone: '', name: '', role: '', level: '', message: '' }
const primaryBtn = 'inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-ink bg-lemon px-7 text-base font-semibold text-ink shadow-[0_1px_0_rgba(38,53,47,0.9)] transition-transform duration-150 motion-safe:hover:-translate-y-0.5 hover:bg-[#f2e04f] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2'

// "Request a callback": parents, students and tutors leave a phone number (the only required
// field) and we call them back. No account or sign-in code. The form needs nothing from the
// backend API: its choices are fixed here and the request is emailed to the team by the
// website itself (see api/enquiryApi.js). Links to #enquire open the parent tab,
// #enquire-tutor the tutor tab.
const levels = ENQUIRY_LEVELS

export default function EnquirySection() {
  const [kind, setKind] = useState('parent')
  const [f, setF] = useState(blank)
  const [extra, setExtra] = useState({ website: '', courseSlug: '' })
  const [error, setError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')

  // Pick the tab from the link (#enquire-tutor) and prefill from ?course= or ?prefill= links.
  useEffect(() => {
    const fromHash = () => { if (window.location.hash === '#enquire-tutor') setKind('tutor'); else if (window.location.hash === '#enquire') setKind('parent') }
    fromHash()
    const params = new URLSearchParams(window.location.search)
    const course = params.get('course')
    const prefill = params.get('prefill')
    if (course) setExtra(x => ({ ...x, courseSlug: course.slice(0, 80) }))
    if (course || prefill) setF(p => ({ ...p, message: [course && `Course: ${course.replace(/-/g, ' ')}`, prefill].filter(Boolean).join(' · ').slice(0, 1000) }))
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!/^[6-9]\d{9}$/.test(f.phone)) { setPhoneError('Enter a 10-digit mobile number'); return }
    setPhoneError('')
    setBusy(true)
    try {
      const body = { kind, phone: f.phone }
      for (const key of ['name', 'level', 'message']) if (f[key].trim()) body[key] = f[key].trim()
      if (kind === 'parent' && f.role) body.role = f.role
      if (kind === 'parent' && extra.courseSlug) body.courseSlug = extra.courseSlug
      if (extra.website) body.website = extra.website
      await sendEnquiry(body)
      setSentTo(f.phone)
      setF(blank)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="enquire" aria-labelledby="enquire-title" className="scroll-mt-20 border-y border-ink/5 bg-white/60">
      <span id="enquire-tutor" className="block scroll-mt-20" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.1fr] md:py-24">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage">Talk to us</p>
          <h2 id="enquire-title" className="mt-3 max-w-[18ch] text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Leave your number. We&apos;ll call you back.
          </h2>
          <p className="mt-4 max-w-[44ch] text-lg leading-relaxed text-sage">
            No sign-up needed. Tell us a little, and our team will call you to understand what you need and find the right tutor, or the right students if you teach.
          </p>
          {hasContact && (
            <ul className="mt-8 space-y-3">
              {CONTACT.phone && (
                <li><a href={CONTACT.phoneHref} className="inline-flex items-center gap-3 rounded-full border border-ink/15 bg-white px-5 py-3 font-semibold text-ink hover:border-ink/40"><FiPhone aria-hidden="true" /> {CONTACT.phone}</a></li>
              )}
              {CONTACT.whatsappHref && (
                <li><a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 rounded-full border border-ink/15 bg-white px-5 py-3 font-semibold text-ink hover:border-ink/40"><FiMessageCircle aria-hidden="true" /> Chat on WhatsApp</a></li>
              )}
              {CONTACT.email && (
                <li><a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-3 rounded-full border border-ink/15 bg-white px-5 py-3 font-semibold text-ink hover:border-ink/40"><FiMail aria-hidden="true" /> {CONTACT.email}</a></li>
              )}
            </ul>
          )}
        </div>

        <div className="rounded-[28px] border border-ink/10 bg-white p-5 shadow-[0_1px_0_rgba(38,53,47,0.06)] sm:p-8">
          {sentTo ? (
            <div className="flex flex-col items-start gap-4 py-6" role="status">
              <FiCheckCircle className="h-10 w-10 text-green-700" aria-hidden="true" />
              <h3 className="text-2xl font-bold text-ink">Thank you!</h3>
              <p className="text-sage">We&apos;ll call you on <strong className="text-ink">+91 {sentTo}</strong> soon.{CONTACT.whatsappHref && ' You can also message us on WhatsApp.'}</p>
              <button type="button" className="font-semibold text-ink underline decoration-lemon decoration-4 underline-offset-4" onClick={() => setSentTo('')}>Send another request</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4">
              <div role="tablist" aria-label="Who is this for" className="grid grid-cols-2 gap-1 rounded-full border border-ink/10 bg-sand-50 p-1">
                {TABS.map(t => (
                  <button key={t.id} type="button" role="tab" aria-selected={kind === t.id}
                    onClick={() => { setKind(t.id); setError('') }}
                    className={`min-h-[44px] rounded-full text-sm font-semibold transition ${kind === t.id ? 'border border-ink bg-lemon text-ink' : 'text-sage hover:text-ink'}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              <TextInput label="Mobile number" required type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit mobile number"
                value={f.phone} onChange={e => { set('phone', e.target.value.replace(/\D/g, '')); setPhoneError('') }} error={phoneError} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Name" hint="Optional" autoComplete="name" maxLength={80} value={f.name} onChange={e => set('name', e.target.value)} />
                {kind === 'parent'
                  ? <Select label="I am" hint="Optional" placeholder="Choose…" options={[{ value: 'parent', label: 'A parent' }, { value: 'student', label: 'A student' }]} value={f.role} onChange={e => set('role', e.target.value)} />
                  : <Select label="I teach" hint="Optional" placeholder="Choose…" options={levels} value={f.level} onChange={e => set('level', e.target.value)} />}
              </div>
              {kind === 'parent' && (
                <Select label="Looking for tuition in" hint="Optional" placeholder="Choose…" options={levels} value={f.level} onChange={e => set('level', e.target.value)} />
              )}
              <TextArea label={kind === 'parent' ? 'Anything else?' : 'About your teaching'} hint="Optional" rows={3} maxLength={1000}
                placeholder={kind === 'parent' ? 'For example: Class 8, maths and science, home tuition in Ameerpet' : 'For example: subjects, experience, area you can travel to'}
                value={f.message} onChange={e => set('message', e.target.value)} />

              {/* Hidden from people; bots fill it in and their requests are ignored. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>Website<input type="text" tabIndex={-1} autoComplete="off" value={extra.website} onChange={e => setExtra(x => ({ ...x, website: e.target.value }))} /></label>
              </div>

              <Notice>{error}</Notice>
              <button type="submit" className={primaryBtn} disabled={busy}>{busy ? 'Sending…' : 'Request a callback'}</button>
              <p className="text-xs text-sage">By sending this, you agree that we may call or WhatsApp you about tuition. We never share your number.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
