'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FiBarChart2, FiBell, FiCalendar, FiUsers, FiClock, FiShield, FiCheck, FiX, FiHelpCircle, FiMapPin } from 'react-icons/fi'
import AppShell from '@/shared/shell/AppShell'
import DataTable from '@/shared/data/DataTable'
import SimpleTable from '@/shared/ui/SimpleTable'
import Countdown from '@/shared/ui/Countdown'
import { StatusBadge } from '@/shared/ui/Badge'
import { btn, Card, PageLoader, SummaryTable } from '@/shared/ui/Card'
import { Notice } from '@/shared/ui/Form'
import { api } from '@/shared/lib/api'
import { usePortal } from '@/shared/lib/usePortal'
import { useMasters } from '@/shared/lib/useMasters'
import { classLabel, daysText, DEMO_STATUS, ENROLMENT_STATUS, formatDate, formatDateTime, MODE_LABELS, OFFER_STATUS, scheduleText, SESSION_STATUS, SLOT_SHORT, slotsText, TUTOR_STATUS, weekday } from '@/shared/lib/format'
import { VerificationBanner } from '@/features/tutor/components/VerificationBanner'
import { AvailabilityForm } from '@/features/tutor/components/availability/AvailabilityForm'
import { AttendanceModal } from '@/features/tutor/components/classes/AttendanceModal'
import { AskModal, DeclineModal } from '@/features/tutor/components/offers/OfferModals'
import { VerificationTab } from '@/features/tutor/components/verification/VerificationTab'
import { TUTOR_API } from '@/features/tutor/api/endpoints'

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
  const { data, error, message, busy, run, reload, logout } = usePortal('tutor', TUTOR_API.overview)
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
                      <button type="button" className={btn.success} disabled={busy} onClick={() => act(TUTOR_API.offerAction(o.id, 'accept'), {}, 'Accepted. Our team will confirm and share the parent’s details.')}><FiCheck aria-hidden="true" /> Accept</button>
                      <button type="button" className={btn.danger} disabled={busy} onClick={() => setDeclining(o)}><FiX aria-hidden="true" /> Decline</button>
                      <span className="flex gap-1.5">
                        <button type="button" className={`${btn.secondary} flex-1 px-2`} disabled={busy} onClick={() => act(TUTOR_API.offerAction(o.id, 'unavailable'), {}, 'Noted. The lead has moved on.')}>Not now</button>
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
          onSave={body => run(() => api(TUTOR_API.profile, { method: 'PATCH', body, role: 'tutor' }), 'Saved.')}
          onSaveTimeOff={(timeOff, message) => run(() => api(TUTOR_API.profile, { method: 'PATCH', body: { timeOff }, role: 'tutor' }), message)} />}

        {tab === 'verification' && masters && <VerificationTab tutor={tutor} masters={masters} busy={busy}
          onUpload={(type, file, details) => {
            const form = new FormData()
            form.append('type', type)
            for (const [key, value] of Object.entries(details)) if (value) form.append(key, value)
            form.append('file', file)
            return run(() => api(TUTOR_API.documents, { method: 'POST', form, role: 'tutor' }), 'Uploaded. We will review it shortly.')
          }}
          onRemove={id => run(() => api(TUTOR_API.document(id), { method: 'DELETE', role: 'tutor' }), 'Document removed.')} />}
      </div>

      {masters && (
        <DeclineModal offer={declining} masters={masters} busy={busy} onClose={() => setDeclining(null)}
          onSubmit={body => post(TUTOR_API.offerAction(declining.id, 'reject'), body, 'Declined. The lead has moved on.').then(() => setDeclining(null))} />
      )}
      <AskModal offer={asking} busy={busy} onClose={() => setAsking(null)}
        onSubmit={message => post(TUTOR_API.offerAction(asking.id, 'request-info'), { message }, 'Question sent to our team. The timer keeps running.').then(() => setAsking(null))} />
      <AttendanceModal session={attendance} busy={busy} onClose={() => setAttendance(null)}
        onSubmit={body => post(TUTOR_API.attendance(attendance.id), body, 'Attendance saved.').then(() => setAttendance(null))} />
    </AppShell>
  )
}

export default function TutorDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Dashboard />
    </Suspense>
  )
}
