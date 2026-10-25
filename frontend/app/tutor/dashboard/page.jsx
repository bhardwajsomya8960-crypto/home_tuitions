'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FiBarChart2, FiBell, FiCalendar, FiUsers, FiClock, FiShield, FiCheck, FiX, FiHelpCircle, FiUpload, FiEye, FiPlus, FiTrash2, FiMapPin, FiStar } from 'react-icons/fi'
import AppShell from '../../../components/shell/AppShell'
import DataTable from '../../../components/data/DataTable'
import Modal from '../../../components/ui/Modal'
import SimpleTable from '../../../components/ui/SimpleTable'
import Countdown from '../../../components/ui/Countdown'
import WeeklyHours, { hoursProblem } from '../../../components/ui/WeeklyHours'
import { StatusBadge } from '../../../components/ui/Badge'
import { btn, Card, PageLoader, SummaryTable } from '../../../components/ui/Card'
import { Checkbox, ChipGroup, Notice, TextArea, TextInput } from '../../../components/ui/Form'
import { api, openProtectedFile } from '../../../lib/api'
import { usePortal } from '../../../lib/usePortal'
import { useMasters } from '../../../lib/useMasters'
import {
  classLabel, daysText, DEMO_STATUS, DOC_STATUS, formatDate, formatDateTime, MODE_LABELS, OFFER_STATUS,
  scheduleText, SESSION_STATUS, slotsText, SLOT_SHORT, TUTOR_STATUS, weekday,
} from '../../../lib/format'

const ENROLMENT_STATUS = { active: { label: 'Active', tone: 'green' }, paused: { label: 'Paused', tone: 'amber' }, completed: { label: 'Completed', tone: 'slate' }, cancelled: { label: 'Cancelled', tone: 'slate' } }

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
  const requirement = o => <span><span className="font-medium">{classLabel(o.lead.class)} {o.lead.board}</span><br /><span className="text-xs text-sage">{o.lead.subjects.join(', ')}</span></span>
  const offerColumns = [
    { key: 'code', header: 'Lead', render: o => <span className="whitespace-nowrap font-medium">{o.lead.code}</span> },
    { key: 'need', header: 'Requirement', render: requirement },
    { key: 'where', header: 'Mode / area', render: o => <span>{MODE_LABELS[o.lead.mode]}<br /><span className="inline-flex items-center gap-1 text-xs text-sage"><FiMapPin className="h-3 w-3" aria-hidden="true" />{o.lead.locality}</span></span> },
    { key: 'distance', header: 'Distance', render: o => (o.lead.mode === 'online' ? '—' : o.distanceKm != null ? `${o.distanceKm} km` : 'Same area') },
    { key: 'when', header: 'Days / times', render: o => <span className="text-xs">{daysText(o.lead.preferredDays)}<br />{slotsText(o.lead.preferredSlots)}</span> },
    { key: 'budget', header: 'Budget / start', render: o => <span className="text-xs">{o.lead.budget || '—'}<br />{o.lead.startDate ? formatDate(o.lead.startDate) : o.lead.urgency || ''}</span> },
    { key: 'notes', header: 'Notes', render: o => <span className="text-xs">{[o.lead.specialRequirements, o.lead.prefLanguages?.length ? `Languages: ${o.lead.prefLanguages.join(', ')}` : '', o.infoRequest ? `Your question: ${o.infoRequest}` : ''].filter(Boolean).join(' · ') || '—'}</span> },
  ]
  // Narrower layout for the respond table: lead + requirement, place + distance, when, budget + notes.
  const offerRespondColumns = [
    { key: 'need', header: 'Lead', render: o => <span><span className="whitespace-nowrap font-medium">{classLabel(o.lead.class)} {o.lead.board}</span><br /><span className="text-xs text-sage">{o.lead.subjects.join(', ')}</span><br /><span className="text-xs text-sage-soft">{o.lead.code}</span></span> },
    { key: 'where', header: 'Where', render: o => <span>{MODE_LABELS[o.lead.mode]}{o.lead.mode !== 'online' && <><br /><span className="text-xs text-sage">{o.lead.locality}</span><br /><span className="text-xs text-sage">{o.distanceKm != null ? `${o.distanceKm} km away` : 'Same area'}</span></>}</span> },
    offerColumns[4],
    { key: 'details', header: 'Budget / notes', render: o => <span className="text-xs">{o.lead.budget || 'Budget not given'}<br /><span className="text-sage">{[o.lead.startDate ? `Start ${formatDate(o.lead.startDate)}` : o.lead.urgency, o.lead.specialRequirements, o.infoRequest && `Your question: ${o.infoRequest}`].filter(Boolean).join(' · ')}</span></span> },
  ]
  const upcomingDemos = data.demos.filter(d => d.status === 'scheduled')
  const upcomingClasses = data.classes.filter(c => c.scheduledDate >= today && c.status === 'scheduled')
  const comingUp = [
    ...upcomingDemos.map(d => ({ id: `d${d.id}`, sort: d.scheduledAt, type: 'Demo', when: formatDateTime(d.scheduledAt), who: d.leadCode, subjects: `${classLabel(d.class)} · ${d.subjects.join(', ')}`, mode: MODE_LABELS[d.mode] })),
    ...upcomingClasses.slice(0, 8).map(c => ({ id: `c${c.id}`, sort: c.scheduledDate, type: 'Class', when: `${weekday(c.scheduledDate)} ${formatDate(c.scheduledDate)} · ${SLOT_SHORT[c.slot]}`, who: c.studentName, subjects: c.subjects.join(', '), mode: MODE_LABELS[c.mode] })),
  ].sort((a, b) => a.sort.localeCompare(b.sort))

  const nav = NAV.map(n => (n.id === 'offers' ? { ...n, count: data.offers.length } : n.id === 'classes' ? { ...n, count: dueAttendance.length } : n.id === 'verification' && !isActive ? { ...n, count: 1 } : n))

  return (
    <AppShell portalLabel="Tutor" user={{ name: tutor.name, subtitle: TUTOR_STATUS[tutor.status]?.label }} navItems={nav} profileTab="availability" activeTab={tab} onTabChange={setTab} onLogout={logout}>
      <div className="space-y-6">
        <Notice>{error}</Notice>
        <Notice tone="success">{message}</Notice>

        {tab === 'overview' && (
          <>
            {!isActive && <VerificationBanner tutor={tutor} onOpen={() => setTab('verification')} />}
            {isActive && !tutor.acceptingLeads && <Notice tone="warning">You have paused new leads. <button type="button" className="font-semibold underline" onClick={() => setTab('availability')}>Resume</button></Notice>}
            <SummaryTable items={[
              { label: 'Open offers', value: data.stats.openOffers, tone: data.stats.openOffers ? 'orange' : undefined },
              { label: 'Active students', value: data.stats.activeStudents },
              { label: 'Classes taught', value: data.stats.classesCompleted },
              { label: 'Rating', value: data.stats.ratingCount ? data.stats.ratingAvg.toFixed(1) : '—', hint: data.stats.ratingCount ? `${data.stats.ratingCount} review(s)` : 'No reviews yet' },
            ]} />
            {data.offers.length > 0 && (
              <Card title="Offers waiting for you" actions={<button type="button" className={btn.link} onClick={() => setTab('offers')}>Respond</button>}>
                <SimpleTable rows={data.offers} minWidth={720} columns={[
                  ...offerColumns.slice(0, 4),
                  { key: 'left', header: 'Time left', render: o => <Countdown expiresAt={o.expiresAt} onExpire={reload} /> },
                ]} />
              </Card>
            )}
            {dueAttendance.length > 0 && (
              <Notice tone="warning">{dueAttendance.length} class(es) need attendance. <button type="button" className="font-semibold underline" onClick={() => setTab('classes')}>Record now</button></Notice>
            )}
            <Card title="Coming up">
              <SimpleTable rows={comingUp} empty="Nothing scheduled yet" minWidth={600} columns={[
                { key: 'type', header: 'Type', render: r => <span className="font-medium">{r.type}</span> },
                { key: 'when', header: 'When', render: r => <span className="whitespace-nowrap">{r.when}</span> },
                { key: 'who', header: 'Student / lead', render: r => r.who },
                { key: 'subjects', header: 'Subjects', render: r => r.subjects },
                { key: 'mode', header: 'Mode', render: r => r.mode },
              ]} />
            </Card>
          </>
        )}

        {tab === 'offers' && (
          <>
            <Card title={`Open offers (${data.offers.length})`} subtitle="Respond before the timer runs out, or the lead moves to the next tutor.">
              <SimpleTable rows={data.offers} minWidth={860}
                empty={isActive ? 'No offers right now. They appear here when a parent near you needs your subjects at a time you are free.' : 'You will receive offers once your account is verified and active.'}
                columns={[
                  ...offerRespondColumns,
                  { key: 'left', header: 'Time left', render: o => <Countdown expiresAt={o.expiresAt} onExpire={reload} /> },
                  { key: 'act', header: 'Respond', sticky: true, render: o => (
                    <div className="flex flex-col gap-1.5">
                      <button type="button" className={btn.success} disabled={busy} onClick={() => act(`/api/tutors/me/offers/${o.id}/accept`, {}, 'Accepted. Our team will confirm and share the parent’s details.')}><FiCheck aria-hidden="true" /> Accept</button>
                      <button type="button" className={btn.danger} disabled={busy} onClick={() => setDeclining(o)}><FiX aria-hidden="true" /> Decline</button>
                      <span className="flex gap-1.5">
                        <button type="button" className={`${btn.secondary} flex-1 px-2`} disabled={busy} onClick={() => act(`/api/tutors/me/offers/${o.id}/unavailable`, {}, 'Noted. The lead has moved on.')}>Not now</button>
                        <button type="button" className={`${btn.secondary} px-2`} disabled={busy} onClick={() => setAsking(o)} aria-label="Ask a question"><FiHelpCircle aria-hidden="true" /></button>
                      </span>
                    </div>
                  ) },
                ]} />
            </Card>
            {data.assignments.length > 0 && (
              <Card title="Accepted leads" subtitle="Parent details appear once our team confirms.">
                <SimpleTable rows={data.assignments} minWidth={900} columns={[
                  offerColumns[0], offerColumns[1], offerColumns[2],
                  { key: 'status', header: 'Status', render: o => <StatusBadge map={OFFER_STATUS} value={o.status} /> },
                  { key: 'parent', header: 'Parent / student', render: o => (o.contact ? <span>{o.contact.parentName}<br /><span className="text-xs text-sage">{o.contact.studentName}</span></span> : <span className="text-xs text-sage">After confirmation</span>) },
                  { key: 'phone', header: 'Phone', render: o => (o.contact ? <a className="whitespace-nowrap underline" href={`tel:+91${o.contact.phone}`}>+91 {o.contact.phone}</a> : '—') },
                  { key: 'address', header: 'Address', render: o => (o.contact ? <span className="text-xs">{o.contact.address || 'Online'}</span> : '—') },
                ]} />
              </Card>
            )}
            {data.history.length > 0 && (
              <DataTable title="Offer history" noun="offers" rows={data.history} rowKey={r => r.id} searchText={r => `${r.lead.code} ${r.lead.subjects.join(' ')}`}
                columns={[
                  { key: 'code', header: 'Lead', render: r => <span className="font-medium">{r.lead.code}</span> },
                  { key: 'need', header: 'Requirement', render: r => `${classLabel(r.lead.class)} ${r.lead.board} · ${r.lead.subjects.join(', ')}` },
                  { key: 'mode', header: 'Mode', render: r => MODE_LABELS[r.lead.mode] },
                  { key: 'offered', header: 'Offered', sortable: true, sortValue: r => r.offeredAt, render: r => formatDateTime(r.offeredAt) },
                  { key: 'status', header: 'Outcome', render: r => <StatusBadge map={OFFER_STATUS} value={r.status} /> },
                ]} />
            )}
          </>
        )}

        {tab === 'classes' && (
          <>
            {data.demos.length > 0 && (
              <Card title="Demos">
                <SimpleTable rows={data.demos} minWidth={720} columns={[
                  { key: 'when', header: 'When', render: d => <span className="whitespace-nowrap font-medium">{formatDateTime(d.scheduledAt)}</span> },
                  { key: 'lead', header: 'Lead', render: d => d.leadCode },
                  { key: 'need', header: 'Requirement', render: d => `${classLabel(d.class)} · ${d.subjects.join(', ')}` },
                  { key: 'mode', header: 'Mode', render: d => MODE_LABELS[d.mode] },
                  { key: 'where', header: 'Place / link', render: d => <span className="text-xs">{d.locationNote || '—'}</span> },
                  { key: 'status', header: 'Status', render: d => <StatusBadge map={DEMO_STATUS} value={d.status} /> },
                ]} />
              </Card>
            )}
            <DataTable title="Classes" noun="classes" rows={data.classes} rowKey={r => r.id} defaultPageSize={20}
              searchText={r => `${r.studentName} ${r.subjects.join(' ')}`}
              filters={[{ key: 'status', label: 'statuses', get: r => r.status, options: Object.entries(SESSION_STATUS).map(([value, v]) => ({ value, label: v.label })) }]}
              columns={[
                { key: 'date', header: 'Date', sortable: true, sortValue: r => r.scheduledDate, render: r => <span className="font-medium">{weekday(r.scheduledDate)} {formatDate(r.scheduledDate)}<br /><span className="text-xs text-sage">{SLOT_SHORT[r.slot]}</span></span> },
                { key: 'student', header: 'Student', render: r => `${r.studentName} · ${r.subjects.join(', ')}` },
                { key: 'attendance', header: 'Attendance', render: r => (r.status === 'completed' ? `${r.tutorPresent ? 'You ✓' : 'You ✗'} · ${r.studentPresent ? 'Student ✓' : 'Student ✗'}` : '—') },
                { key: 'notes', header: 'Notes', render: r => <span className="text-xs">{r.notes || '—'}</span> },
                { key: 'status', header: 'Status', render: r => <StatusBadge map={SESSION_STATUS} value={r.status} /> },
                { key: 'act', header: '', sticky: true, render: r => (r.status === 'scheduled' && r.scheduledDate <= today ? <button type="button" className={btn.primary} onClick={() => setAttendance(r)}>Record</button> : null) },
              ]}
              emptyMessage="Classes appear here once a parent enrols." />
          </>
        )}

        {tab === 'students' && (
          <DataTable title="Students" noun="students" rows={data.students} rowKey={r => r.enrolmentId}
            searchText={r => `${r.studentName} ${r.parentName} ${r.subjects.join(' ')}`}
            filters={[{ key: 'status', label: 'statuses', get: r => r.status, options: Object.entries(ENROLMENT_STATUS).map(([value, v]) => ({ value, label: v.label })) }]}
            columns={[
              { key: 'student', header: 'Student', sortable: true, sortValue: r => r.studentName, render: r => <span><span className="font-medium">{r.studentName}</span><br /><span className="text-xs text-sage">{classLabel(r.class)} · {r.board}</span></span> },
              { key: 'subjects', header: 'Subjects', render: r => r.subjects.join(', ') },
              { key: 'schedule', header: 'Schedule', render: r => <span className="text-xs">{scheduleText(r.schedule)}</span> },
              { key: 'mode', header: 'Mode', render: r => MODE_LABELS[r.mode] },
              { key: 'start', header: 'Started', sortable: true, sortValue: r => r.startDate, render: r => formatDate(r.startDate) },
              { key: 'classes', header: 'Classes', align: 'right', sortable: true, sortValue: r => r.classesCompleted, render: r => r.classesCompleted },
              { key: 'attendance', header: 'Attendance', align: 'right', render: r => (r.attendanceRate === null ? '—' : `${r.attendanceRate}%`) },
              { key: 'parent', header: 'Parent', render: r => <span>{r.parentName}<br /><a className="text-xs underline" href={`tel:+91${r.parentPhone}`}>+91 {r.parentPhone}</a></span> },
              { key: 'status', header: 'Status', render: r => <StatusBadge map={ENROLMENT_STATUS} value={r.status} /> },
            ]}
            emptyMessage="Students appear here after a demo converts into tuition." />
        )}

        {tab === 'availability' && masters && <AvailabilityForm tutor={tutor} masters={masters} busy={busy}
          onSave={body => run(() => api('/api/tutors/me', { method: 'PATCH', body, role: 'tutor' }), 'Saved.')}
          onSaveTimeOff={(timeOff, message) => run(() => api('/api/tutors/me', { method: 'PATCH', body: { timeOff }, role: 'tutor' }), message)} />}

        {tab === 'verification' && masters && <VerificationTab tutor={tutor} masters={masters} busy={busy}
          onUpload={(type, file, details) => {
            const form = new FormData()
            form.append('type', type)
            for (const [key, value] of Object.entries(details)) if (value) form.append(key, value)
            form.append('file', file)
            return run(() => api('/api/tutors/me/documents', { method: 'POST', form, role: 'tutor' }), 'Uploaded. We will review it shortly.')
          }}
          onRemove={id => run(() => api(`/api/tutors/me/documents/${id}`, { method: 'DELETE', role: 'tutor' }), 'Document removed.')} />}
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

const istToday = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10)
const dayCount = (from, to) => Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1

// Holidays and leave. Saved straight away; while on leave the tutor is not offered new leads.
function TimeOffCard({ timeOff, busy, onSave }) {
  const today = istToday()
  const upcoming = timeOff.filter(t => t.to >= today)
  const [f, setF] = useState({ from: '', to: '', reason: '' })
  const [error, setError] = useState('')
  const add = () => {
    if (!f.from || !f.to) return setError('Choose the first and last day.')
    if (f.to < f.from) return setError('The last day must be on or after the first day.')
    setError('')
    const entry = { from: f.from, to: f.to, ...(f.reason.trim() ? { reason: f.reason.trim() } : {}) }
    onSave([...upcoming, entry], 'Time off added.').then(() => setF({ from: '', to: '', reason: '' })).catch(err => setError(err.message))
  }
  const remove = entry => onSave(upcoming.filter(t => t !== entry), 'Time off removed.').catch(() => {})

  return (
    <Card title="Holidays and time off" subtitle="Add days you cannot teach, such as holidays, exams or travel. You will not get new lead offers on these days.">
      <div className="space-y-4">
        <SimpleTable rows={upcoming.map((t, i) => ({ ...t, id: `${t.from}-${i}`, entry: t }))} minWidth={520} empty="No upcoming time off." columns={[
          { key: 'dates', header: 'Dates', render: t => <span className="font-medium">{t.from === t.to ? formatDate(t.from) : `${formatDate(t.from)} – ${formatDate(t.to)}`}</span> },
          { key: 'days', header: 'Days', render: t => { const n = dayCount(t.from, t.to); return `${n} day${n === 1 ? '' : 's'}` } },
          { key: 'reason', header: 'Reason', render: t => t.reason || <span className="text-sage">—</span> },
          { key: 'act', header: '', align: 'right', render: t => <button type="button" className={btn.danger} disabled={busy} onClick={() => remove(t.entry)}><FiTrash2 aria-hidden="true" /> Remove</button> },
        ]} />
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_2fr_auto]">
          <TextInput label="First day" type="date" min={today} value={f.from} onChange={e => setF({ ...f, from: e.target.value, to: f.to && f.to < e.target.value ? e.target.value : f.to })} />
          <TextInput label="Last day" type="date" min={f.from || today} value={f.to} onChange={e => setF({ ...f, to: e.target.value })} />
          <TextInput label="Reason" hint="Optional" maxLength={100} value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} placeholder="For example: Diwali holidays" />
          <button type="button" className={`${btn.primary} sm:mb-5`} disabled={busy} onClick={add}><FiPlus aria-hidden="true" /> Add time off</button>
        </div>
        <Notice>{error}</Notice>
      </div>
    </Card>
  )
}

function AvailabilityForm({ tutor, masters, busy, onSave, onSaveTimeOff }) {
  const [f, setF] = useState(() => ({
    availability: tutor.availability, acceptingLeads: tutor.acceptingLeads, demoAvailable: tutor.demoAvailable,
    serviceRadiusKm: tutor.serviceRadiusKm, feeMin: tutor.feeMin ?? '', feeMax: tutor.feeMax ?? '', bio: tutor.bio,
    subjects: tutor.subjects, classes: tutor.classes, modes: tutor.modes,
  }))
  const [errors, setErrors] = useState({})
  const save = () => {
    const e = {}
    const hours = hoursProblem(f.availability)
    if (hours) e.availability = hours
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
      <Card title="When you can teach" subtitle="We only offer you leads at times you are free. Classes you already teach are taken out automatically.">
        <WeeklyHours days={masters.days} value={f.availability} onChange={v => setF({ ...f, availability: v })} error={errors.availability} />
      </Card>
      <TimeOffCard timeOff={tutor.timeOff || []} busy={busy} onSave={onSaveTimeOff} />
      <Card title="What you teach">
        <div className="space-y-4">
          <ChipGroup label="Subjects" options={masters.subjects} value={f.subjects} onChange={v => setF({ ...f, subjects: v })} error={errors.subjects} />
          <ChipGroup label="Classes" options={masters.classes.map(c => ({ value: c, label: classLabel(c) }))} value={f.classes} onChange={v => setF({ ...f, classes: v })} error={errors.classes} />
          <ChipGroup label="Modes" options={masters.tutorModes.map(m => ({ value: m, label: MODE_LABELS[m] }))} value={f.modes} onChange={v => setF({ ...f, modes: v })} error={errors.modes} />
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

// Wording for each document section. Every type except the photo takes several named files.
const DOC_SECTIONS = {
  photo: { hint: 'A clear, recent photo of your face. JPG or PNG.' },
  identity: { hint: 'Aadhaar, PAN, passport or driving licence. Add each one separately.', noun: 'identity document', nameLabel: 'Document name', placeholder: 'For example: Aadhaar card' },
  qualification: { hint: 'Degrees, diplomas and teaching certificates. Add each one separately.', noun: 'qualification', nameLabel: 'Certificate name', placeholder: 'For example: MSc Mathematics' },
  experience: { hint: 'Experience letters or certificates from schools or institutes.', noun: 'experience proof', nameLabel: 'Document name', placeholder: 'For example: Experience letter, ABC School' },
}
const fileSize = bytes => `${Math.max(1, Math.round(bytes / 1024))} KB`

function VerificationTab({ tutor, masters, busy, onUpload, onRemove }) {
  const [adding, setAdding] = useState(null)
  const [removing, setRemoving] = useState(null)
  const viewFile = doc => openProtectedFile(`/api/tutors/me/documents/${doc.id}/file`, 'tutor').catch(() => {})

  return (
    <div className="space-y-4">
      <Card title="Account status" actions={<StatusBadge map={TUTOR_STATUS} value={tutor.status} />}>
        <ol className="flex flex-wrap gap-2 text-xs">
          {['pending', 'documents_submitted', 'under_review', 'verified', 'active'].map((s, i, all) => {
            const reached = all.indexOf(tutor.status) >= i
            return <li key={s} className={`rounded-full px-3 py-1 font-semibold ${reached ? 'bg-green-100 text-green-800' : 'bg-sand-100 text-sage'}`}>{i + 1}. {TUTOR_STATUS[s].label}</li>
          })}
        </ol>
        {tutor.statusNotes && <p className="mt-3 text-sm text-sage">Note from our team: {tutor.statusNotes}</p>}
      </Card>
      <p className="text-sm text-sage">Files can be PDF, JPG or PNG, up to 5 MB each. Sections marked <span className="text-red-600">*</span> need at least one file.</p>

      {masters.documentTypes.map(type => {
        const section = DOC_SECTIONS[type.value] || {}
        const docs = tutor.documents.filter(d => d.type === type.value)
        const title = <>{type.label}{type.required && <span className="text-red-600"> *</span>}</>
        const action = type.multiple
          ? <button type="button" className={btn.primary} disabled={busy} onClick={() => setAdding(type)}><FiPlus aria-hidden="true" /> Add {section.noun || 'document'}</button>
          : (
            <label className={`${btn.primary} cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}>
              <FiUpload aria-hidden="true" /> {docs.length ? 'Replace photo' : 'Upload photo'}
              <input type="file" className="sr-only" accept="image/jpeg,image/png"
                onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) onUpload(type.value, file, {}).catch(() => {}) }} />
            </label>
          )
        // The photo shows only the latest upload; other sections list every file.
        const rows = type.multiple ? docs : docs.slice(0, 1)
        return (
          <Card key={type.value} title={title} subtitle={section.hint} actions={action}>
            <SimpleTable rows={rows} minWidth={720} empty={type.multiple ? `No ${section.noun || 'document'} added yet.` : 'No photo uploaded yet.'} columns={[
              { key: 'name', header: 'Name', render: d => <span className="flex flex-col"><span className="font-medium">{d.title || type.label}</span>{d.description && <span className="text-xs text-sage">{d.description}</span>}</span> },
              { key: 'file', header: 'File', render: d => <span className="text-xs">{d.originalName} · {fileSize(d.sizeBytes)}</span> },
              { key: 'date', header: 'Uploaded', render: d => formatDate(d.createdAt) },
              { key: 'status', header: 'Status', render: d => <span className="flex flex-col items-start gap-1"><StatusBadge map={DOC_STATUS} value={d.status} />{d.rejectReason && <span className="text-xs text-red-700">{d.rejectReason}</span>}</span> },
              { key: 'act', header: '', align: 'right', sticky: true, render: d => (
                <span className="inline-flex gap-2">
                  <button type="button" className={btn.secondary} onClick={() => viewFile(d)}><FiEye aria-hidden="true" /> View</button>
                  {type.multiple && d.status !== 'accepted' && <button type="button" className={btn.danger} disabled={busy} onClick={() => setRemoving(d)} aria-label={`Remove ${d.title}`}><FiTrash2 aria-hidden="true" /> Remove</button>}
                </span>
              ) },
            ]} />
          </Card>
        )
      })}

      <AddDocumentModal type={adding} section={adding ? DOC_SECTIONS[adding.value] || {} : {}} busy={busy} onClose={() => setAdding(null)}
        onSubmit={(file, details) => onUpload(adding.value, file, details).then(() => setAdding(null))} />
      <Modal open={!!removing} title="Remove document" onClose={() => setRemoving(null)}
        footer={<><button type="button" className={btn.secondary} onClick={() => setRemoving(null)}>Cancel</button>
          <button type="button" className={btn.danger} disabled={busy} onClick={() => onRemove(removing.id).then(() => setRemoving(null)).catch(() => {})}>Remove</button></>}>
        {removing && <p className="text-sm">Remove <strong>{removing.title}</strong> ({removing.originalName})? You can add it again later.</p>}
      </Modal>
    </div>
  )
}

// Adds one named document: name (required), description (optional) and the file.
function AddDocumentModal({ type, section, busy, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { if (type) { setTitle(''); setDescription(''); setFile(null); setError('') } }, [type])

  const submit = e => {
    e.preventDefault()
    if (title.trim().length < 2) return setError(`Enter the ${(section.nameLabel || 'document name').toLowerCase()}.`)
    if (!file) return setError('Choose a file to upload.')
    if (file.size > 5 * 1024 * 1024) return setError('Files must be 5 MB or smaller.')
    setError('')
    onSubmit(file, { title: title.trim(), description: description.trim() }).catch(err => setError(err.message))
  }

  return (
    <Modal open={!!type} title={`Add ${section.noun || 'document'}`} onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button>
        <button type="submit" form="add-document" className={btn.primary} disabled={busy}>{busy ? 'Uploading…' : 'Add'}</button></>}>
      <form id="add-document" onSubmit={submit} className="space-y-4" noValidate>
        <TextInput label={section.nameLabel || 'Document name'} required maxLength={120} value={title} onChange={e => { setTitle(e.target.value); setError('') }} placeholder={section.placeholder} />
        <TextArea label="Description" hint="Optional. For example the university, board or year." rows={2} maxLength={500} value={description} onChange={e => setDescription(e.target.value)} />
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">File <span className="text-red-600">*</span></p>
          <label className="flex cursor-pointer flex-wrap items-center gap-3 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-3 text-sm hover:border-ink/40">
            <span className={btn.secondary}><FiUpload aria-hidden="true" /> Choose file</span>
            <span className={file ? 'font-medium text-ink' : 'text-sage'}>{file ? `${file.name} · ${fileSize(file.size)}` : 'PDF, JPG or PNG, up to 5 MB'}</span>
            <input type="file" aria-label="File" className="sr-only" accept="application/pdf,image/jpeg,image/png" onChange={e => { setFile(e.target.files?.[0] || null); setError('') }} />
          </label>
        </div>
        <Notice>{error}</Notice>
      </form>
    </Modal>
  )
}

export default function TutorDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Dashboard />
    </Suspense>
  )
}
