'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FiBarChart2, FiBook, FiCalendar, FiDollarSign, FiFileText, FiUser, FiPlus } from 'react-icons/fi'
import AppShell from '@/shared/shell/AppShell'
import DataTable from '@/shared/data/DataTable'
import Modal from '@/shared/ui/Modal'
import SimpleTable from '@/shared/ui/SimpleTable'
import { StatusBadge } from '@/shared/ui/Badge'
import { btn, Card, Details, PageLoader, SummaryTable } from '@/shared/ui/Card'
import { Notice } from '@/shared/ui/Form'
import { api } from '@/shared/lib/api'
import { usePortal } from '@/shared/lib/usePortal'
import { useMasters } from '@/shared/lib/useMasters'
import { classLabel, DEMO_STATUS, formatDate, formatDateTime, INVOICE_STATUS, LEAD_STATUS, MODE_LABELS, rupees, SLOT_SHORT, weekday } from '@/shared/lib/format'
import { AddStudentModal } from '@/features/parent/components/AddStudentModal'
import { ClassesTab } from '@/features/parent/components/ClassesTab'
import { NewRequestModal } from '@/features/parent/components/NewRequestModal'
import { RequestDetail } from '@/features/parent/components/RequestDetail'
import { PARENT_API } from '@/features/parent/api/endpoints'

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
  const portal = usePortal('parent', PARENT_API.overview)
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
    <AppShell portalLabel="Parent" user={{ name: data.parent.name, subtitle: `+91 ${data.parent.phone}` }} navItems={nav} profileTab="profile" activeTab={tab} onTabChange={setTab} onLogout={logout}>
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
          onSubmit={body => run(() => api(PARENT_API.requests, { method: 'POST', body, role: 'parent' }), 'Request submitted. We will start looking for tutors.').then(() => { setNewRequest(false); setTab('requests') })} busy={busy} />
      )}
      {masters && (
        <AddStudentModal open={addStudent} onClose={() => setAddStudent(false)} masters={masters} busy={busy}
          onSubmit={body => run(() => api(PARENT_API.students, { method: 'POST', body, role: 'parent' }), 'Student added.').then(() => setAddStudent(false))} />
      )}
    </AppShell>
  )
}

export default function ParentDashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Dashboard />
    </Suspense>
  )
}
