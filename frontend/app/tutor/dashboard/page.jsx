'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FiBarChart2, FiBell, FiCalendar, FiUsers, FiClock, FiShield, FiCheck, FiX, FiHelpCircle, FiUpload, FiEye, FiMapPin, FiStar } from 'react-icons/fi'
import AppShell from '../../../components/shell/AppShell'
import DataTable from '../../../components/data/DataTable'
import RecordCard from '../../../components/data/RecordCard'
import Modal from '../../../components/ui/Modal'
import Countdown from '../../../components/ui/Countdown'
import SlotGrid from '../../../components/ui/SlotGrid'
import { StatusBadge } from '../../../components/ui/Badge'
import { btn, Card, Details, EmptyState, PageLoader, StatCard } from '../../../components/ui/Card'
import { Checkbox, ChipGroup, Notice, TextArea, TextInput } from '../../../components/ui/Form'
import { api, openProtectedFile } from '../../../lib/api'
import { usePortal } from '../../../lib/usePortal'
import { useMasters } from '../../../lib/useMasters'
import {
  classLabel, daysText, DEMO_STATUS, DOC_STATUS, formatDate, formatDateTime, MODE_LABELS, OFFER_STATUS,
  scheduleText, SESSION_STATUS, slotsText, SLOT_SHORT, TUTOR_STATUS, weekday,
} from '../../../lib/format'

const NAV = [
  { id: 'overview', label: 'Overview', icon: FiBarChart2 },
  { id: 'offers', label: 'Lead offers', icon: FiBell },
  { id: 'classes', label: 'Classes', icon: FiCalendar },
  { id: 'students', label: 'Students', icon: FiUsers },
  { id: 'availability', label: 'Availability', icon: FiClock },
  { id: 'verification', label: 'Verification', icon: FiShield },
]

function Dashboard() {
  const params = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') || 'overview')
  const { data, error, message, busy, run, reload, logout } = usePortal('tutor', '/api/tutors/me/overview')
  const { masters } = useMasters()
  const [declining, setDeclining] = useState(null)
  const [asking, setAsking] = useState(null)
  const [attendance, setAttendance] = useState(null)

  // Offers change without user action (expiry, new offers): refresh every 30 seconds.
  useEffect(() => {
    const t = setInterval(reload, 30000)
    return () => clearInterval(t)
  }, [reload])

  if (!data) return error ? <div className="p-6"><Notice>{error}</Notice></div> : <PageLoader />

  const { tutor } = data
  const post = (path, body, success) => run(() => api(path, { method: 'POST', body, role: 'tutor' }), success)
  const act = (...args) => post(...args).catch(() => false)
  const isActive = tutor.status === 'active'
  const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10)
  const dueAttendance = data.classes.filter(c => c.status === 'scheduled' && c.scheduledDate <= today)
  const nav = NAV.map(n => (n.id === 'offers' ? { ...n, count: data.offers.length } : n.id === 'classes' ? { ...n, count: dueAttendance.length } : n.id === 'verification' && !isActive ? { ...n, count: 1 } : n))

  return (
    <AppShell portalLabel="Tutor" user={{ name: tutor.name, subtitle: TUTOR_STATUS[tutor.status]?.label }} navItems={nav} activeTab={tab} onTabChange={setTab} onLogout={logout}>
      <div className="space-y-6">
        <Notice>{error}</Notice>
        <Notice tone="success">{message}</Notice>

        {tab === 'overview' && (
          <>
            {!isActive && <VerificationBanner tutor={tutor} onOpen={() => setTab('verification')} />}
            {isActive && !tutor.acceptingLeads && <Notice tone="warning">You have paused new leads. <button type="button" className="font-semibold underline" onClick={() => setTab('availability')}>Resume</button></Notice>}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
              <StatCard label="Open offers" value={data.stats.openOffers} icon={FiBell} tone={data.stats.openOffers ? 'orange' : 'blue'} />
              <StatCard label="Active students" value={data.stats.activeStudents} icon={FiUsers} tone="green" />
              <StatCard label="Classes taught" value={data.stats.classesCompleted} icon={FiCalendar} tone="purple" />
              <StatCard label="Rating" value={data.stats.ratingCount ? data.stats.ratingAvg.toFixed(1) : '—'} hint={data.stats.ratingCount ? `${data.stats.ratingCount} review(s)` : 'No reviews yet'} icon={FiStar} />
            </div>
            {data.offers.length > 0 && (
              <Card title="Offers waiting for you" actions={<button type="button" className={btn.link} onClick={() => setTab('offers')}>Open offers</button>}>
                <ul className="divide-y divide-gray-100">
                  {data.offers.map(o => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                      <span><strong>{classLabel(o.lead.class)} {o.lead.board}</strong> · {o.lead.subjects.join(', ')} · {MODE_LABELS[o.lead.mode]}{o.distanceKm != null ? ` · ${o.distanceKm} km` : ''}</span>
                      <Countdown expiresAt={o.expiresAt} onExpire={reload} />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {dueAttendance.length > 0 && (
              <Notice tone="warning">{dueAttendance.length} class(es) need attendance. <button type="button" className="font-semibold underline" onClick={() => setTab('classes')}>Record now</button></Notice>
            )}
            <Card title="Coming up">
              {data.classes.filter(c => c.scheduledDate >= today && c.status === 'scheduled').length === 0 && data.demos.filter(d => d.status === 'scheduled').length === 0
                ? <EmptyState title="Nothing scheduled">Accepted leads, demos and classes will appear here.</EmptyState>
                : (
                  <ul className="divide-y divide-gray-100">
                    {data.demos.filter(d => d.status === 'scheduled').map(d => (
                      <li key={d.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <span><strong>Demo</strong> · {d.leadCode} · {classLabel(d.class)} {d.subjects.join(', ')}</span>
                        <span className="font-medium">{formatDateTime(d.scheduledAt)}</span>
                      </li>
                    ))}
                    {data.classes.filter(c => c.scheduledDate >= today && c.status === 'scheduled').slice(0, 6).map(c => (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <span><strong>{c.studentName}</strong> · {c.subjects.join(', ')} · {MODE_LABELS[c.mode]}</span>
                        <span className="font-medium">{weekday(c.scheduledDate)} {formatDate(c.scheduledDate)} · {SLOT_SHORT[c.slot]}</span>
                      </li>
                    ))}
                  </ul>
                )}
            </Card>
          </>
        )}

        {tab === 'offers' && (
          <>
            {data.offers.length === 0 && data.assignments.length === 0 && (
              <Card><EmptyState title="No offers right now">{isActive ? 'When a parent near you needs your subjects at a time you are free, the offer appears here. You have a limited time to respond.' : 'You will receive offers once your account is verified and active.'}</EmptyState></Card>
            )}
            {data.offers.map(o => (
              <OfferCard key={o.id} offer={o} busy={busy} onExpire={reload}
                onAccept={() => act(`/api/tutors/me/offers/${o.id}/accept`, {}, 'Accepted. Our team will confirm and share the parent’s details.')}
                onDecline={() => setDeclining(o)} onAsk={() => setAsking(o)}
                onUnavailable={() => act(`/api/tutors/me/offers/${o.id}/unavailable`, {}, 'Noted. The lead has moved on.')} />
            ))}
            {data.assignments.map(o => <OfferCard key={o.id} offer={o} />)}
            {data.history.length > 0 && (
              <DataTable title="Offer history" noun="offers" rows={data.history} rowKey={r => r.id} searchText={r => `${r.lead.code} ${r.lead.subjects.join(' ')}`}
                columns={[
                  { key: 'code', header: 'Lead', render: r => <span className="font-medium">{r.lead.code}</span> },
                  { key: 'need', header: 'Requirement', render: r => `${classLabel(r.lead.class)} ${r.lead.board} · ${r.lead.subjects.join(', ')}` },
                  { key: 'mode', header: 'Mode', render: r => MODE_LABELS[r.lead.mode] },
                  { key: 'offered', header: 'Offered', sortable: true, sortValue: r => r.offeredAt, render: r => formatDateTime(r.offeredAt) },
                  { key: 'status', header: 'Outcome', render: r => <StatusBadge map={OFFER_STATUS} value={r.status} /> },
                ]}
                renderCard={r => <RecordCard title={r.lead.code} subtitle={`${classLabel(r.lead.class)} · ${r.lead.subjects.join(', ')}`} badge={<StatusBadge map={OFFER_STATUS} value={r.status} />} fields={[['Offered', formatDateTime(r.offeredAt)], ['Mode', MODE_LABELS[r.lead.mode]]]} />} />
            )}
          </>
        )}

        {tab === 'classes' && (
          <>
            {data.demos.length > 0 && (
              <Card title="Demos">
                <ul className="divide-y divide-gray-100">
                  {data.demos.map(d => (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                      <span><strong>{d.leadCode}</strong> · {classLabel(d.class)} {d.subjects.join(', ')} · {formatDateTime(d.scheduledAt)} · {MODE_LABELS[d.mode]}{d.locationNote ? ` · ${d.locationNote}` : ''}</span>
                      <StatusBadge map={DEMO_STATUS} value={d.status} />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <DataTable title="Classes" noun="classes" rows={data.classes} rowKey={r => r.id} defaultPageSize={20}
              searchText={r => `${r.studentName} ${r.subjects.join(' ')}`}
              filters={[{ key: 'status', label: 'statuses', get: r => r.status, options: Object.entries(SESSION_STATUS).map(([value, v]) => ({ value, label: v.label })) }]}
              columns={[
                { key: 'date', header: 'Date', sortable: true, sortValue: r => r.scheduledDate, render: r => <span className="font-medium">{weekday(r.scheduledDate)} {formatDate(r.scheduledDate)}<br /><span className="text-xs text-gray-500">{SLOT_SHORT[r.slot]}</span></span> },
                { key: 'student', header: 'Student', render: r => `${r.studentName} · ${r.subjects.join(', ')}` },
                { key: 'attendance', header: 'Attendance', render: r => (r.status === 'completed' ? `${r.tutorPresent ? 'You ✓' : 'You ✗'} · ${r.studentPresent ? 'Student ✓' : 'Student ✗'}` : '—') },
                { key: 'notes', header: 'Notes', render: r => <span className="text-xs">{r.notes || '—'}</span> },
                { key: 'status', header: 'Status', render: r => <StatusBadge map={SESSION_STATUS} value={r.status} /> },
                { key: 'act', header: '', render: r => (r.status === 'scheduled' && r.scheduledDate <= today ? <button type="button" className={btn.primary} onClick={() => setAttendance(r)}>Record</button> : null) },
              ]}
              renderCard={r => (
                <RecordCard title={`${weekday(r.scheduledDate)} ${formatDate(r.scheduledDate)} · ${SLOT_SHORT[r.slot]}`} subtitle={`${r.studentName} · ${r.subjects.join(', ')}`} badge={<StatusBadge map={SESSION_STATUS} value={r.status} />}
                  fields={[['Mode', MODE_LABELS[r.mode]], ['Notes', r.notes || '—']]}
                  actions={r.status === 'scheduled' && r.scheduledDate <= today ? <button type="button" className={btn.primary} onClick={() => setAttendance(r)}>Record attendance</button> : null} />
              )}
              emptyMessage="Classes appear here once a parent enrols." />
          </>
        )}

        {tab === 'students' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.students.length === 0 && <Card className="lg:col-span-2"><EmptyState title="No students yet">Students appear here after a demo converts into tuition.</EmptyState></Card>}
            {data.students.map(s => (
              <Card key={s.enrolmentId} title={s.studentName} subtitle={`${classLabel(s.class)} ${s.board} · ${s.subjects.join(', ')}`} actions={<StatusBadge map={{ active: { label: 'Active', tone: 'green' }, paused: { label: 'Paused', tone: 'amber' }, completed: { label: 'Completed', tone: 'slate' }, cancelled: { label: 'Cancelled', tone: 'slate' } }} value={s.status} />}>
                <Details items={[['Schedule', scheduleText(s.schedule)], ['Mode', MODE_LABELS[s.mode]], ['Started', formatDate(s.startDate)], ['Classes taught', s.classesCompleted],
                  ['Attendance', s.attendanceRate === null ? '—' : `${s.attendanceRate}%`], ['Parent', `${s.parentName} · +91 ${s.parentPhone}`]]} />
              </Card>
            ))}
          </div>
        )}

        {tab === 'availability' && masters && <AvailabilityForm tutor={tutor} masters={masters} busy={busy}
          onSave={body => run(() => api('/api/tutors/me', { method: 'PATCH', body, role: 'tutor' }), 'Saved.')} />}

        {tab === 'verification' && masters && <VerificationTab tutor={tutor} masters={masters} busy={busy}
          onUpload={(type, file) => {
            const form = new FormData()
            form.append('type', type)
            form.append('file', file)
            return run(() => api('/api/tutors/me/documents', { method: 'POST', form, role: 'tutor' }), 'Uploaded. We will review it shortly.').catch(() => false)
          }} />}
      </div>

      {masters && (
        <DeclineModal offer={declining} masters={masters} busy={busy} onClose={() => setDeclining(null)}
          onSubmit={body => post(`/api/tutors/me/offers/${declining.id}/reject`, body, 'Declined. The lead has moved on.').then(() => setDeclining(null))} />
      )}
      <AskModal offer={asking} busy={busy} onClose={() => setAsking(null)}
        onSubmit={message => post(`/api/tutors/me/offers/${asking.id}/request-info`, { message }, 'Question sent to our team. The timer keeps running.').then(() => setAsking(null))} />
      <AttendanceModal session={attendance} busy={busy} onClose={() => setAttendance(null)}
        onSubmit={body => post(`/api/tutors/me/classes/${attendance.id}/attendance`, body, 'Attendance saved.').then(() => setAttendance(null))} />
    </AppShell>
  )
}

function VerificationBanner({ tutor, onOpen }) {
  const text = {
    pending: 'Upload your photo, identity document and qualification certificate to get verified.',
    documents_submitted: 'Thanks. Your documents are waiting for review.',
    under_review: 'Your documents are being reviewed.',
    verified: 'You are verified. Our team will activate your account shortly.',
    suspended: `Your account is suspended. ${tutor.statusNotes || 'Contact support.'}`,
    rejected: `Your application was not approved. ${tutor.statusNotes || ''}`,
  }[tutor.status]
  return (
    <Notice tone={['suspended', 'rejected'].includes(tutor.status) ? 'error' : 'warning'}>
      {text} {tutor.status === 'pending' && <button type="button" className="font-semibold underline" onClick={onOpen}>Upload documents</button>}
    </Notice>
  )
}

// Lead acceptance screen (blueprint §8). Parent identity and address appear only after confirmation.
function OfferCard({ offer: o, busy, onAccept, onDecline, onAsk, onUnavailable, onExpire }) {
  const open = o.status === 'offered'
  return (
    <Card title={`${classLabel(o.lead.class)} ${o.lead.board} · ${o.lead.subjects.join(', ')}`} subtitle={`Lead ${o.lead.code} · ${MODE_LABELS[o.lead.mode]}`}
      actions={open ? <Countdown expiresAt={o.expiresAt} onExpire={onExpire} /> : <StatusBadge map={OFFER_STATUS} value={o.status} />}>
      <Details items={[
        ['Area', <span key="a" className="inline-flex items-center gap-1"><FiMapPin className="h-4 w-4" aria-hidden="true" />{o.lead.locality}</span>],
        ['Distance', o.lead.mode === 'online' ? 'Online' : o.distanceKm != null ? `About ${o.distanceKm} km` : 'Same area'],
        ['Days', daysText(o.lead.preferredDays)], ['Times', slotsText(o.lead.preferredSlots)],
        ['Budget', o.lead.budget], ['Start', o.lead.startDate ? formatDate(o.lead.startDate) : o.lead.urgency],
        o.lead.prefLanguages?.length ? ['Languages', o.lead.prefLanguages.join(', ')] : null,
        o.lead.specialRequirements ? ['Notes from parent', o.lead.specialRequirements] : null,
      ]} />
      {o.infoRequest && <p className="mt-3 text-sm text-gray-600"><strong>Your question:</strong> {o.infoRequest}</p>}
      {o.contact && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-semibold text-green-900">Confirmed. Contact details</p>
          <Details items={[['Parent', o.contact.parentName], ['Student', o.contact.studentName], ['Phone', <a key="p" className="underline" href={`tel:+91${o.contact.phone}`}>+91 {o.contact.phone}</a>], ['Address', o.contact.address || 'Online']]} />
        </div>
      )}
      {o.status === 'accepted' && <p className="mt-4 text-sm text-gray-600">You accepted this lead. Our team will confirm and arrange the demo.</p>}
      {open && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className={btn.success} disabled={busy} onClick={onAccept}><FiCheck aria-hidden="true" /> Accept</button>
          <button type="button" className={btn.danger} disabled={busy} onClick={onDecline}><FiX aria-hidden="true" /> Decline</button>
          <button type="button" className={btn.secondary} disabled={busy} onClick={onUnavailable}>Not available now</button>
          <button type="button" className={btn.secondary} disabled={busy} onClick={onAsk}><FiHelpCircle aria-hidden="true" /> Ask a question</button>
        </div>
      )}
    </Card>
  )
}

function DeclineModal({ offer, masters, busy, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { setReason(''); setComment(''); setErr('') }, [offer])
  const submit = () => {
    if (!reason) return setErr('Choose a reason')
    if (reason === 'other' && comment.trim().length < 3) return setErr('Tell us briefly why')
    onSubmit({ reason, ...(comment ? { comment } : {}) }).catch(() => {})
    return undefined
  }
  return (
    <Modal open={!!offer} title="Decline this lead" onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Back</button><button type="button" className={btn.primary} disabled={busy} onClick={submit}>Decline lead</button></>}>
      <div className="space-y-4">
        <ChipGroup label="Reason" required single options={masters.rejectReasons} value={reason} onChange={setReason} error={err && !reason ? err : ''} />
        <TextArea label="Comment" hint={reason === 'other' ? 'Required' : 'Optional'} rows={2} value={comment} onChange={e => setComment(e.target.value)} error={err && reason ? err : ''} />
      </div>
    </Modal>
  )
}

function AskModal({ offer, busy, onClose, onSubmit }) {
  const [text, setText] = useState('')
  useEffect(() => setText(''), [offer])
  return (
    <Modal open={!!offer} title="Ask our team about this lead" onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={busy || text.trim().length < 3} onClick={() => onSubmit(text.trim()).catch(() => {})}>Send question</button></>}>
      <TextArea label="Your question" required rows={3} maxLength={500} value={text} onChange={e => setText(e.target.value)} hint="The offer timer keeps running while you wait." />
    </Modal>
  )
}

function AttendanceModal({ session, busy, onClose, onSubmit }) {
  const [f, setF] = useState({ tutorPresent: true, studentPresent: true, notes: '', homework: '' })
  useEffect(() => setF({ tutorPresent: true, studentPresent: true, notes: '', homework: '' }), [session])
  return (
    <Modal open={!!session} title={session ? `${session.studentName} · ${formatDate(session.scheduledDate)}` : ''} onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button>
        <button type="button" className={btn.primary} disabled={busy} onClick={() => onSubmit({ tutorPresent: f.tutorPresent, studentPresent: f.studentPresent, ...(f.notes ? { notes: f.notes } : {}), ...(f.homework ? { homework: f.homework } : {}) }).catch(() => {})}>Save attendance</button></>}>
      <div className="space-y-4">
        <Checkbox checked={f.tutorPresent} onChange={v => setF({ ...f, tutorPresent: v })} label="I took this class" />
        <Checkbox checked={f.studentPresent} onChange={v => setF({ ...f, studentPresent: v })} label="The student attended" />
        <TextArea label="What you covered" hint="Parents see this" rows={2} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
        <TextArea label="Homework" hint="Optional" rows={2} value={f.homework} onChange={e => setF({ ...f, homework: e.target.value })} />
      </div>
    </Modal>
  )
}

function AvailabilityForm({ tutor, masters, busy, onSave }) {
  const [f, setF] = useState(() => ({
    availability: tutor.availability, acceptingLeads: tutor.acceptingLeads, demoAvailable: tutor.demoAvailable,
    serviceRadiusKm: tutor.serviceRadiusKm, feeMin: tutor.feeMin ?? '', feeMax: tutor.feeMax ?? '', bio: tutor.bio,
    subjects: tutor.subjects, classes: tutor.classes, modes: tutor.modes,
  }))
  const [errors, setErrors] = useState({})
  const save = () => {
    const e = {}
    if (!f.availability.length) e.availability = 'Choose at least one time'
    if (f.bio.trim().length < 50) e.bio = 'Write at least 50 characters'
    if (!f.subjects.length) e.subjects = 'Choose at least one subject'
    if (!f.classes.length) e.classes = 'Choose at least one class'
    if (!f.modes.length) e.modes = 'Choose at least one mode'
    setErrors(e)
    if (Object.keys(e).length) return
    onSave({
      availability: f.availability, acceptingLeads: f.acceptingLeads, demoAvailable: f.demoAvailable, serviceRadiusKm: Number(f.serviceRadiusKm),
      bio: f.bio.trim(), subjects: f.subjects, classes: f.classes, modes: f.modes,
      ...(f.feeMin !== '' ? { feeMin: Number(f.feeMin) } : {}), ...(f.feeMax !== '' ? { feeMax: Number(f.feeMax) } : {}),
    }).catch(err => setErrors(err.fieldErrors ? err.fieldErrors() : {}))
  }
  return (
    <div className="space-y-4">
      <Card title="Lead preferences">
        <div className="space-y-3">
          <Checkbox checked={f.acceptingLeads} onChange={v => setF({ ...f, acceptingLeads: v })} label="Send me new lead offers" />
          <Checkbox checked={f.demoAvailable} onChange={v => setF({ ...f, demoAvailable: v })} label="I can give free demo classes" />
          {f.modes.includes('home') && <TextInput className="max-w-xs" label="Home tuition travel distance (km)" type="number" min={1} max={50} value={f.serviceRadiusKm} onChange={e => setF({ ...f, serviceRadiusKm: e.target.value })} error={errors.serviceRadiusKm} />}
        </div>
      </Card>
      <Card title="When you can teach"><SlotGrid days={masters.days} slots={masters.slots} value={f.availability} onChange={v => setF({ ...f, availability: v })} error={errors.availability} accent="purple" /></Card>
      <Card title="What you teach">
        <div className="space-y-4">
          <ChipGroup label="Subjects" options={masters.subjects} value={f.subjects} onChange={v => setF({ ...f, subjects: v })} error={errors.subjects} accent="purple" />
          <ChipGroup label="Classes" options={masters.classes.map(c => ({ value: c, label: classLabel(c) }))} value={f.classes} onChange={v => setF({ ...f, classes: v })} error={errors.classes} accent="purple" />
          <ChipGroup label="Modes" options={masters.tutorModes.map(m => ({ value: m, label: MODE_LABELS[m] }))} value={f.modes} onChange={v => setF({ ...f, modes: v })} error={errors.modes} accent="purple" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Fee from (₹ / month)" type="number" min={0} value={f.feeMin} onChange={e => setF({ ...f, feeMin: e.target.value })} />
            <TextInput label="Fee up to (₹ / month)" type="number" min={0} value={f.feeMax} onChange={e => setF({ ...f, feeMax: e.target.value })} error={errors.feeMax} />
          </div>
          <TextArea label="About you" rows={4} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} error={errors.bio} hint="Parents see this once you accept a lead" />
        </div>
      </Card>
      <div className="flex justify-end"><button type="button" className={btn.primary} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    </div>
  )
}

function VerificationTab({ tutor, masters, busy, onUpload }) {
  const latest = type => tutor.documents.find(d => d.type === type)
  return (
    <div className="space-y-4">
      <Card title="Account status" actions={<StatusBadge map={TUTOR_STATUS} value={tutor.status} />}>
        <ol className="flex flex-wrap gap-2 text-xs">
          {['pending', 'documents_submitted', 'under_review', 'verified', 'active'].map((s, i, all) => {
            const reached = all.indexOf(tutor.status) >= i
            return <li key={s} className={`rounded-full px-3 py-1 font-semibold ${reached ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>{i + 1}. {TUTOR_STATUS[s].label}</li>
          })}
        </ol>
        {tutor.statusNotes && <p className="mt-3 text-sm text-gray-600">Note from our team: {tutor.statusNotes}</p>}
      </Card>
      <Card title="Documents" subtitle="PDF, JPG or PNG up to 5 MB. Photos must be JPG or PNG.">
        <ul className="divide-y divide-gray-100">
          {masters.documentTypes.map(t => {
            const doc = latest(t.value)
            return (
              <li key={t.value} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="font-medium">{t.label}{t.required && <span className="text-red-600"> *</span>}</p>
                  {doc ? (
                    <p className="text-sm text-gray-600">{doc.originalName} · {formatDate(doc.createdAt)} <StatusBadge map={DOC_STATUS} value={doc.status} />{doc.rejectReason && <span className="block text-red-700">Reason: {doc.rejectReason}</span>}</p>
                  ) : <p className="text-sm text-gray-500">Not uploaded</p>}
                </div>
                <div className="flex gap-2">
                  {doc && <button type="button" className={btn.secondary} onClick={() => openProtectedFile(`/api/tutors/me/documents/${doc.id}/file`, 'tutor').catch(() => {})}><FiEye aria-hidden="true" /> View</button>}
                  <label className={`${btn.primary} cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}>
                    <FiUpload aria-hidden="true" /> {doc ? 'Replace' : 'Upload'}
                    <input type="file" className="sr-only" accept={t.value === 'photo' ? 'image/jpeg,image/png' : 'application/pdf,image/jpeg,image/png'}
                      onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) onUpload(t.value, file) }} />
                  </label>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

export default function TutorDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Dashboard />
    </Suspense>
  )
}
