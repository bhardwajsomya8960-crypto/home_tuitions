'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FiBarChart2, FiBook, FiCalendar, FiDollarSign, FiFileText, FiUser, FiPlus, FiStar } from 'react-icons/fi'
import AppShell from '../../../components/shell/AppShell'
import DataTable from '../../../components/data/DataTable'
import Modal from '../../../components/ui/Modal'
import SimpleTable from '../../../components/ui/SimpleTable'
import { StatusBadge } from '../../../components/ui/Badge'
import { btn, Card, Details, PageLoader, SummaryTable } from '../../../components/ui/Card'
import { ChipGroup, Notice, Select, TextArea, TextInput } from '../../../components/ui/Form'
import { api } from '../../../lib/api'
import { usePortal } from '../../../lib/usePortal'
import { useMasters, optionLabel } from '../../../lib/useMasters'
import {
  classLabel, DAY_LABELS, daysText, DEMO_STATUS, formatDate, formatDateTime, INVOICE_STATUS, LEAD_STATUS, MODE_LABELS,
  rupees, scheduleText, SESSION_STATUS, slotsText, SLOT_SHORT, weekday,
} from '../../../lib/format'

const NAV = [
  { id: 'overview', label: 'Overview', icon: FiBarChart2 },
  { id: 'requests', label: 'Requests', icon: FiFileText },
  { id: 'classes', label: 'Classes', icon: FiCalendar },
  { id: 'fees', label: 'Fees', icon: FiDollarSign },
  { id: 'students', label: 'Students', icon: FiBook },
  { id: 'profile', label: 'Profile', icon: FiUser },
]

function Dashboard() {
  const params = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') || 'overview')
  const portal = usePortal('parent', '/api/parents/me/overview')
  const { masters } = useMasters()
  const [newRequest, setNewRequest] = useState(false)
  const [addStudent, setAddStudent] = useState(false)
  const [openRequestId, setOpenRequestId] = useState(null)
  const { data, error, message, busy, run, logout } = portal

  if (!data) return error ? <div className="p-6"><Notice>{error}</Notice></div> : <PageLoader />

  // The error is already shown by usePortal; swallow it here so button handlers do not reject.
  const act = (path, body, success) => run(() => api(path, { method: 'POST', body, role: 'parent' }), success).catch(() => false)
  const pendingOutcome = data.requests.filter(r => r.status === 'demo_completed' && r.demos.some(d => d.status === 'completed' && !d.outcome))
  const toRate = data.requests.filter(r => r.demos.some(d => d.status === 'completed') && !r.reviewedStages.includes(r.enrolment ? 'ongoing' : 'demo'))
  const due = data.invoices.filter(i => i.outstanding > 0)
  // One row per thing the parent should act on.
  const attention = [
    ...pendingOutcome.map(r => ({ id: `o${r.id}`, what: 'Demo feedback', student: r.student?.name, detail: `How did the demo with ${r.tutor?.name} go?`, action: 'Tell us', go: () => setOpenRequestId(r.id) })),
    ...due.map(i => ({ id: `i${i.id}`, what: i.overdue ? 'Fee overdue' : 'Fee due', student: '', detail: `${i.periodLabel}: ${rupees(i.outstanding)} due ${formatDate(i.dueDate)}`, action: 'View', go: () => setTab('fees'), urgent: i.overdue })),
    ...toRate.filter(r => !pendingOutcome.includes(r)).map(r => ({ id: `r${r.id}`, what: 'Rate tutor', student: r.student?.name, detail: `Rate ${r.tutor?.name || 'your tutor'}`, action: 'Rate', go: () => setOpenRequestId(r.id) })),
  ]
  const needsAction = r => pendingOutcome.includes(r) || toRate.includes(r)
  const openRequest = data.requests.find(r => r.id === openRequestId)
  const requestColumns = [
    { key: 'code', header: 'Request', sortable: true, sortValue: r => r.code, render: r => <button type="button" className="font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-4 hover:decoration-ink" onClick={() => setOpenRequestId(r.id)}>{r.code}</button> },
    { key: 'student', header: 'Student', sortable: true, sortValue: r => r.student?.name || '', render: r => <span>{r.student?.name}<br /><span className="text-xs text-sage">{classLabel(r.class)} · {r.board}</span></span> },
    { key: 'subjects', header: 'Subjects', render: r => r.subjects.join(', ') },
    { key: 'mode', header: 'Mode', render: r => MODE_LABELS[r.mode] },
    { key: 'tutor', header: 'Tutor', render: r => (r.tutor ? `${r.tutor.name}${r.tutor.confirmed ? '' : ' (pending)'}` : '—') },
    { key: 'demo', header: 'Demo', render: r => { const d = r.demos[0]; return d ? <span>{formatDateTime(d.scheduledAt)}<br /><StatusBadge map={DEMO_STATUS} value={d.status} /></span> : '—' } },
    { key: 'update', header: 'Latest update', render: r => <span className="text-xs">{r.timeline.at(-1)?.text}<br /><span className="text-sage">{formatDateTime(r.timeline.at(-1)?.at)}</span></span> },
    { key: 'status', header: 'Status', render: r => <span className="flex flex-col items-start gap-1"><StatusBadge map={LEAD_STATUS} value={r.status} />{needsAction(r) && <span className="text-xs font-semibold text-amber-700">Action needed</span>}</span> },
    { key: 'open', header: '', align: 'right', sticky: true, render: r => <button type="button" className={btn.secondary} onClick={() => setOpenRequestId(r.id)}>Open</button> },
  ]

  const nav = NAV.map(n => (n.id === 'requests' ? { ...n, count: pendingOutcome.length } : n.id === 'fees' ? { ...n, count: due.length } : n))

  return (
    <AppShell portalLabel="Parent" user={{ name: data.parent.name, subtitle: `+91 ${data.parent.phone}` }} navItems={nav} profileTab="profile" activeTab={tab} onTabChange={setTab} onLogout={logout}
      headerActions={<button type="button" onClick={() => setNewRequest(true)} className={btn.primary}><FiPlus aria-hidden="true" /> New request</button>}>
      <div className="space-y-6">
        <Notice>{error}</Notice>
        <Notice tone="success">{message}</Notice>

        {tab === 'overview' && (
          <>
            <SummaryTable items={[
              { label: 'Students', value: data.stats.students },
              { label: 'Active tuitions', value: data.stats.activeEnrolments },
              { label: 'Open requests', value: data.stats.openRequests },
              { label: 'Amount due', value: rupees(data.stats.amountDue), tone: data.stats.amountDue ? 'orange' : undefined },
            ]} />

            <button type="button" onClick={() => setNewRequest(true)} className={`${btn.primary} w-full md:hidden`}><FiPlus aria-hidden="true" /> New tuition request</button>

            {attention.length > 0 && (
              <Card title="Needs your attention">
                <SimpleTable rows={attention} minWidth={560} rowClassName={a => (a.urgent ? 'bg-red-50/50' : '')} columns={[
                  { key: 'what', header: 'Item', render: a => <span className={`font-medium ${a.urgent ? 'text-red-700' : ''}`}>{a.what}</span> },
                  { key: 'student', header: 'Student', render: a => a.student || '—' },
                  { key: 'detail', header: 'Details', render: a => a.detail },
                  { key: 'go', header: '', align: 'right', render: a => <button type="button" className={btn.secondary} onClick={a.go}>{a.action}</button> },
                ]} />
              </Card>
            )}

            <Card title="Upcoming classes" actions={<button type="button" className={btn.link} onClick={() => setTab('classes')}>All classes</button>}>
              <SimpleTable rows={data.upcomingClasses.slice(0, 8)} empty="No classes scheduled yet" columns={[
                { key: 'date', header: 'Date', render: c => <span className="whitespace-nowrap font-medium">{weekday(c.scheduledDate)} {formatDate(c.scheduledDate)}</span> },
                { key: 'time', header: 'Time', render: c => SLOT_SHORT[c.slot] },
                { key: 'student', header: 'Student', render: c => c.studentName },
                { key: 'subjects', header: 'Subjects', render: c => c.subjects.join(', ') },
                { key: 'tutor', header: 'Tutor', render: c => c.tutorName },
                { key: 'mode', header: 'Mode', render: c => MODE_LABELS[c.mode] },
              ]} />
            </Card>

            <Card title="Your requests" actions={<button type="button" className={btn.link} onClick={() => setTab('requests')}>All requests</button>}>
              <SimpleTable rows={data.requests} empty="No requests yet" minWidth={900} columns={requestColumns.filter(c => c.key !== 'demo')} />
            </Card>
          </>
        )}

        {tab === 'requests' && (
          <DataTable title="Requests" noun="requests" rows={data.requests} rowKey={r => r.id} columns={requestColumns}
            searchText={r => `${r.code} ${r.student?.name} ${r.subjects.join(' ')} ${r.tutor?.name || ''}`}
            filters={[{ key: 'status', label: 'statuses', get: r => r.status, options: Object.entries(LEAD_STATUS).map(([value, v]) => ({ value, label: v.label })) }]}
            toolbarExtra={<button type="button" className={btn.primary} onClick={() => setNewRequest(true)}><FiPlus aria-hidden="true" /> New request</button>}
            emptyMessage="No requests yet. Use New request to ask for a tutor." />
        )}

        {tab === 'classes' && <ClassesTab run={run} />}

        {tab === 'fees' && (
          <>
            <Notice tone="info">Online payment is not available yet. Pay by UPI or bank transfer using the details our team shares with you; payments appear here once recorded.</Notice>
            <DataTable
              title="Invoices" noun="invoices" rows={data.invoices} rowKey={r => r.id}
              searchText={r => `${r.number} ${r.periodLabel}`}
              filters={[{ key: 'status', label: 'statuses', get: r => r.status, options: Object.entries(INVOICE_STATUS).map(([value, v]) => ({ value, label: v.label })) }]}
              columns={[
                { key: 'number', header: 'Invoice', render: r => <span className="font-medium">{r.number}</span> },
                { key: 'period', header: 'Period', render: r => r.periodLabel },
                { key: 'amount', header: 'Amount', align: 'right', sortable: true, sortValue: r => r.amount, render: r => rupees(r.amount) },
                { key: 'paid', header: 'Paid', align: 'right', render: r => rupees(r.amountPaid) },
                { key: 'due', header: 'Due date', sortable: true, sortValue: r => r.dueDate, render: r => <span className={r.overdue ? 'font-semibold text-red-700' : ''}>{formatDate(r.dueDate)}</span> },
                { key: 'status', header: 'Status', render: r => <StatusBadge map={INVOICE_STATUS} value={r.status} /> },
              ]}
              emptyMessage="No invoices yet. The first invoice is created when tuition starts."
            />
          </>
        )}

        {tab === 'students' && (
          <Card title="Students" actions={<button type="button" className={btn.primary} onClick={() => setAddStudent(true)}><FiPlus aria-hidden="true" /> Add student</button>}>
            <SimpleTable rows={data.students} empty="No students yet" minWidth={560} columns={[
              { key: 'name', header: 'Name', render: st => <span className="font-medium">{st.name}</span> },
              { key: 'class', header: 'Class', render: st => classLabel(st.class) },
              { key: 'board', header: 'Board', render: st => st.board },
              { key: 'school', header: 'School', render: st => st.school || '—' },
              { key: 'requests', header: 'Requests', align: 'right', render: st => data.requests.filter(r => r.student?.id === st.id).length },
              { key: 'active', header: 'Active tuitions', align: 'right', render: st => data.requests.filter(r => r.student?.id === st.id && r.enrolment?.status === 'active').length },
            ]} />
          </Card>
        )}

        {tab === 'profile' && (
          <Card title="Your details">
            <Details items={[['Name', data.parent.name], ['Mobile', `+91 ${data.parent.phone}`], ['Email', data.parent.email], ['Relationship', data.parent.relationship], ['Address', data.parent.address ? `${data.parent.address}, ${data.parent.pincode}` : '']]} />
            <p className="mt-4 text-sm text-sage">To change these details, contact support.</p>
            <button type="button" onClick={logout} className={`${btn.danger} mt-4`}>Sign out</button>
          </Card>
        )}
      </div>

      <Modal open={!!openRequest} title={openRequest ? `${openRequest.code} · ${openRequest.student?.name}` : ''} onClose={() => setOpenRequestId(null)} wide>
        {openRequest && <RequestDetail request={openRequest} masters={masters} busy={busy} act={act} />}
      </Modal>

      {masters && (
        <NewRequestModal open={newRequest} onClose={() => setNewRequest(false)} masters={masters} students={data.students} parent={data.parent}
          onSubmit={body => run(() => api('/api/parents/me/requests', { method: 'POST', body, role: 'parent' }), 'Request submitted. We will start looking for tutors.').then(() => { setNewRequest(false); setTab('requests') })} busy={busy} />
      )}
      {masters && (
        <AddStudentModal open={addStudent} onClose={() => setAddStudent(false)} masters={masters} busy={busy}
          onSubmit={body => run(() => api('/api/parents/me/students', { method: 'POST', body, role: 'parent' }), 'Student added.').then(() => setAddStudent(false))} />
      )}
    </AppShell>
  )
}

function RequestDetail({ request: r, masters, busy, act }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reschedule, setReschedule] = useState(null)
  const [rescheduleText, setRescheduleText] = useState('')
  const completedDemo = r.demos.find(d => d.status === 'completed')
  const scheduledDemo = r.demos.find(d => d.status === 'scheduled')
  const stage = r.enrolment ? 'ongoing' : 'demo'
  const canRate = completedDemo && !r.reviewedStages.includes(stage)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-sage"><StatusBadge map={LEAD_STATUS} value={r.status} /> {r.subjects.join(', ')} · {classLabel(r.class)} {r.board} · {MODE_LABELS[r.mode]}</div>
      <div className="space-y-5">
          <Details items={[
            ['Days', daysText(r.preferredDays)], ['Times', slotsText(r.preferredSlots)],
            ['Budget', masters ? optionLabel(masters.budgetRanges, r.budgetRange) : r.budgetRange], ['Start', r.startDate ? formatDate(r.startDate) : ''],
            ['Location', r.mode === 'online' ? 'Online' : `${r.address || ''}${r.pincode ? `, ${r.pincode}` : ''}`],
          ]} />

          {r.tutor && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">{r.tutor.confirmed ? 'Your tutor' : 'Tutor available (awaiting our confirmation)'}</h3>
              <Details items={[
                ['Name', r.tutor.name],
                ['Qualification', r.tutor.qualification],
                ['Experience', `${r.tutor.experienceYears} years`],
                ['Languages', r.tutor.languages.join(', ')],
                ['Rating', r.tutor.ratingCount > 0 ? <span key="r" className="inline-flex items-center gap-1"><FiStar className="h-4 w-4 fill-current text-yellow-500" aria-hidden="true" /> {r.tutor.ratingAvg.toFixed(1)} ({r.tutor.ratingCount})</span> : 'No reviews yet'],
                ['About', r.tutor.bio],
                ['Contact', r.tutor.phone ? <a key="c" className="underline" href={`tel:+91${r.tutor.phone}`}>+91 {r.tutor.phone}</a> : 'Shared after confirmation'],
              ]} />
            </div>
          )}

          {r.demos.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Demo</h3>
              <SimpleTable flush={false} rows={r.demos} minWidth={560} columns={[
                { key: 'when', header: 'When', render: d => <span className="whitespace-nowrap">{formatDateTime(d.scheduledAt)}</span> },
                { key: 'mode', header: 'Mode', render: d => MODE_LABELS[d.mode] },
                { key: 'len', header: 'Length', render: d => `${d.durationMin} min` },
                { key: 'where', header: 'Place / link', render: d => d.locationNote || '—' },
                { key: 'status', header: 'Status', render: d => <StatusBadge map={DEMO_STATUS} value={d.status} /> },
              ]} />
              {scheduledDemo && <button type="button" className={`${btn.link} mt-2`} onClick={() => setReschedule(scheduledDemo.id)}>Ask to reschedule</button>}
            </div>
          )}

          {r.status === 'demo_completed' && completedDemo && !completedDemo.outcome && masters && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold">How did the demo go?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {masters.demoOutcomes.map(o => (
                  <button key={o.value} type="button" disabled={busy} className={o.value === 'interested' ? btn.success : btn.secondary}
                    onClick={() => act(`/api/parents/me/demos/${completedDemo.id}/outcome`, { outcome: o.value }, 'Thank you. Our team will follow up.')}>{o.label}</button>
                ))}
              </div>
            </div>
          )}

          {r.enrolment && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Tuition</h3>
              <Details items={[
                ['Status', r.enrolment.status], ['Fee', `${rupees(r.enrolment.feeAmount)} · ${r.enrolment.plan.replace('_', ' ')}`],
                ['Started', formatDate(r.enrolment.startDate)], ['Schedule', scheduleText(r.enrolment.schedule)],
              ]} />
            </div>
          )}

          {canRate && (
            <div className="rounded-lg border border-sand-200 p-4">
              <p className="font-semibold">Rate {r.tutor?.name || 'the tutor'} {stage === 'demo' ? 'after the demo' : 'so far'}</p>
              <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-yellow-50">
                    <FiStar className={`h-6 w-6 ${n <= rating ? 'fill-current text-yellow-500' : 'text-sand-300'}`} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <TextArea label="Comment" hint="Optional" rows={2} value={comment} onChange={e => setComment(e.target.value)} className="mt-2" />
              <button type="button" disabled={!rating || busy} className={`${btn.primary} mt-3`} onClick={() => act(`/api/parents/me/requests/${r.id}/review`, { rating, ...(comment ? { comment } : {}) }, 'Thanks for your feedback.')}>Submit rating</button>
            </div>
          )}

          {r.canCancel && (
            <button type="button" disabled={busy} className={btn.danger} onClick={() => { if (window.confirm('Cancel this request? Tutors will stop receiving it.')) act(`/api/parents/me/requests/${r.id}/cancel`, {}, 'Request cancelled.') }}>Cancel request</button>
          )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Progress</h3>
        <SimpleTable flush={false} rows={[...r.timeline].reverse().map((t, i) => ({ ...t, id: i }))} minWidth={420} columns={[
          { key: 'at', header: 'When', render: t => <span className="whitespace-nowrap">{formatDateTime(t.at)}</span> },
          { key: 'text', header: 'Update', render: t => t.text },
        ]} />
      </div>

      <Modal open={!!reschedule} title="Ask to reschedule the demo" onClose={() => setReschedule(null)}
        footer={<><button type="button" className={btn.secondary} onClick={() => setReschedule(null)}>Close</button>
          <button type="button" className={btn.primary} disabled={busy || rescheduleText.trim().length < 3}
            onClick={() => act(`/api/parents/me/demos/${reschedule}/reschedule-request`, { message: rescheduleText }, 'Request sent. Our team will confirm a new time.').then(ok => { if (ok !== false) { setReschedule(null); setRescheduleText('') } })}>Send</button></>}>
        <TextArea label="When would suit you?" required rows={3} value={rescheduleText} onChange={e => setRescheduleText(e.target.value)} hint="For example: Saturday after 11 AM" />
      </Modal>
    </div>
  )
}

function ClassesTab({ run }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const load = () => api('/api/parents/me/classes', { role: 'parent' }).then(r => setRows(r.items)).catch(e => setError(e.message))
  useEffect(() => { load() }, [])
  if (error) return <Notice>{error}</Notice>
  if (!rows) return <PageLoader />
  const ack = id => run(() => api(`/api/parents/me/classes/${id}/acknowledge`, { method: 'POST', role: 'parent' }), 'Thanks for confirming.').then(load).catch(() => {})
  return (
    <DataTable
      title="Classes" noun="classes" rows={rows} rowKey={r => r.id} defaultPageSize={20}
      searchText={r => `${r.studentName} ${r.tutorName} ${r.subjects.join(' ')} ${r.notes || ''}`}
      filters={[{ key: 'status', label: 'statuses', get: r => r.status, options: Object.entries(SESSION_STATUS).map(([value, v]) => ({ value, label: v.label })) }]}
      columns={[
        { key: 'date', header: 'Date', sortable: true, sortValue: r => r.scheduledDate, render: r => <span className="font-medium">{weekday(r.scheduledDate)} {formatDate(r.scheduledDate)}<br /><span className="text-xs text-sage">{SLOT_SHORT[r.slot]}</span></span> },
        { key: 'student', header: 'Student', render: r => `${r.studentName} · ${r.subjects.join(', ')}` },
        { key: 'tutor', header: 'Tutor', render: r => r.tutorName },
        { key: 'attendance', header: 'Attendance', render: r => (r.status === 'completed' ? (r.studentPresent ? 'Attended' : 'Student absent') : '—') },
        { key: 'notes', header: 'Notes / homework', render: r => <span className="text-xs">{[r.notes, r.homework && `Homework: ${r.homework}`].filter(Boolean).join(' · ') || '—'}</span> },
        { key: 'status', header: 'Status', render: r => <StatusBadge map={SESSION_STATUS} value={r.status} /> },
        { key: 'ack', header: '', render: r => (r.status === 'completed' && !r.parentAckAt ? <button type="button" className={btn.secondary} onClick={() => ack(r.id)}>Confirm</button> : r.parentAckAt ? <span className="text-xs text-green-700">Confirmed</span> : null) },
      ]}
      emptyMessage="No classes yet."
    />
  )
}

function NewRequestModal({ open, onClose, masters, students, parent, onSubmit, busy }) {
  const blank = { studentId: students[0]?.id || 'new', studentName: '', studentClass: '', board: '', subjects: [], mode: '', address: parent.address || '', pincode: parent.pincode || '', preferredDays: [], preferredSlots: [], budgetRange: '', urgency: '', specialRequirements: '' }
  const [f, setF] = useState(blank)
  const [errors, setErrors] = useState({})
  useEffect(() => { if (open) { setF(blank); setErrors({}) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const submit = async () => {
    const e = {}
    if (f.studentId === 'new') {
      if (f.studentName.trim().length < 2) e.studentName = 'Enter a name'
      if (!f.studentClass) e.studentClass = 'Choose a class'
      if (!f.board) e.board = 'Choose a board'
    }
    if (!f.subjects.length) e.subjects = 'Choose at least one subject'
    if (!f.mode) e.mode = 'Choose a mode'
    if (f.mode && f.mode !== 'online') {
      if (f.address.trim().length < 5) e.address = 'Enter the address'
      if (!/^[1-9]\d{5}$/.test(f.pincode)) e.pincode = 'Enter a 6-digit pincode'
    }
    if (!f.preferredDays.length) e.preferredDays = 'Choose at least one day'
    if (!f.preferredSlots.length) e.preferredSlots = 'Choose at least one time'
    setErrors(e)
    if (Object.keys(e).length) return
    const body = {
      ...(f.studentId === 'new' ? { studentName: f.studentName.trim(), studentClass: f.studentClass, board: f.board } : { studentId: f.studentId }),
      subjects: f.subjects, mode: f.mode, preferredDays: f.preferredDays, preferredSlots: f.preferredSlots,
      ...(f.mode !== 'online' ? { address: f.address, pincode: f.pincode } : {}),
      ...(f.budgetRange ? { budgetRange: f.budgetRange } : {}), ...(f.urgency ? { urgency: f.urgency } : {}),
      ...(f.specialRequirements ? { specialRequirements: f.specialRequirements } : {}),
    }
    try { await onSubmit(body) } catch (err) { setErrors(err.fieldErrors ? err.fieldErrors() : {}) }
  }

  return (
    <Modal open={open} title="New tuition request" onClose={onClose} wide
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit request'}</button></>}>
      <div className="space-y-4">
        <Select label="For which student?" required value={f.studentId} onChange={e => set('studentId', e.target.value)}
          options={[...students.map(s => ({ value: s.id, label: `${s.name} (${classLabel(s.class)})` })), { value: 'new', label: '+ A new student' }]} placeholder="Choose…" />
        {f.studentId === 'new' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput label="Student name" required value={f.studentName} onChange={e => set('studentName', e.target.value)} error={errors.studentName} />
            <Select label="Class" required options={masters.classes.map(c => ({ value: c, label: classLabel(c) }))} value={f.studentClass} onChange={e => set('studentClass', e.target.value)} error={errors.studentClass} />
            <Select label="Board" required options={masters.boards} value={f.board} onChange={e => set('board', e.target.value)} error={errors.board} />
          </div>
        )}
        <ChipGroup label="Subjects" required options={masters.subjects} value={f.subjects} onChange={v => set('subjects', v)} error={errors.subjects} />
        <ChipGroup label="Mode" required single options={masters.leadModes.map(m => ({ value: m, label: MODE_LABELS[m] }))} value={f.mode} onChange={v => set('mode', v)} error={errors.mode} />
        {f.mode && f.mode !== 'online' && (
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <TextInput label="Address" required value={f.address} onChange={e => set('address', e.target.value)} error={errors.address} />
            <TextInput label="Pincode" required inputMode="numeric" maxLength={6} value={f.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))} error={errors.pincode} />
          </div>
        )}
        <ChipGroup label="Days" required options={masters.days.map(d => ({ value: d, label: DAY_LABELS[d] }))} value={f.preferredDays} onChange={v => set('preferredDays', v)} error={errors.preferredDays} />
        <ChipGroup label="Times" required options={masters.slots} value={f.preferredSlots} onChange={v => set('preferredSlots', v)} error={errors.preferredSlots} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Monthly budget" options={masters.budgetRanges} value={f.budgetRange} onChange={e => set('budgetRange', e.target.value)} placeholder="Not sure yet" />
          <Select label="How soon?" options={masters.urgency} value={f.urgency} onChange={e => set('urgency', e.target.value)} placeholder="No rush" />
        </div>
        <TextArea label="Notes for the tutor" hint="Optional" value={f.specialRequirements} onChange={e => set('specialRequirements', e.target.value)} />
      </div>
    </Modal>
  )
}

function AddStudentModal({ open, onClose, masters, onSubmit, busy }) {
  const [f, setF] = useState({ studentName: '', studentClass: '', board: '', school: '' })
  const [errors, setErrors] = useState({})
  useEffect(() => { if (open) { setF({ studentName: '', studentClass: '', board: '', school: '' }); setErrors({}) } }, [open])
  const submit = async () => {
    const e = {}
    if (f.studentName.trim().length < 2) e.studentName = 'Enter a name'
    if (!f.studentClass) e.studentClass = 'Choose a class'
    if (!f.board) e.board = 'Choose a board'
    setErrors(e)
    if (Object.keys(e).length) return
    try { await onSubmit({ studentName: f.studentName.trim(), studentClass: f.studentClass, board: f.board, ...(f.school ? { school: f.school } : {}) }) } catch (err) { setErrors(err.fieldErrors ? err.fieldErrors() : {}) }
  }
  return (
    <Modal open={open} title="Add a student" onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={busy} onClick={submit}>Add student</button></>}>
      <div className="space-y-4">
        <TextInput label="Name" required value={f.studentName} onChange={e => setF({ ...f, studentName: e.target.value })} error={errors.studentName} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Class" required options={masters.classes.map(c => ({ value: c, label: classLabel(c) }))} value={f.studentClass} onChange={e => setF({ ...f, studentClass: e.target.value })} error={errors.studentClass} />
          <Select label="Board" required options={masters.boards} value={f.board} onChange={e => setF({ ...f, board: e.target.value })} error={errors.board} />
        </div>
        <TextInput label="School" hint="Optional" value={f.school} onChange={e => setF({ ...f, school: e.target.value })} />
      </div>
    </Modal>
  )
}

export default function ParentDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Dashboard />
    </Suspense>
  )
}
