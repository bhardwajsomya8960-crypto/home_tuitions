'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FiBarChart2, FiUsers, FiActivity, FiUserCheck, FiDollarSign, FiSettings, FiList, FiPlus, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi'
import AppShell from '../../../components/shell/AppShell'
import DataTable from '../../../components/data/DataTable'
import Modal from '../../../components/ui/Modal'
import SimpleTable from '../../../components/ui/SimpleTable'
import Countdown from '../../../components/ui/Countdown'
import { StatusBadge } from '../../../components/ui/Badge'
import { btn, Card, PageLoader, SummaryTable } from '../../../components/ui/Card'
import { ChipGroup, Notice, Select, TextArea, TextInput } from '../../../components/ui/Form'
import LeadWorkspace from '../../../components/admin/LeadWorkspace'
import TutorReview from '../../../components/admin/TutorReview'
import SettingsForm from '../../../components/admin/SettingsForm'
import { api } from '../../../lib/api'
import { usePortal } from '../../../lib/usePortal'
import { useMasters } from '../../../lib/useMasters'
import {
  classLabel, DAY_LABELS, formatDate, formatDateTime, INVOICE_STATUS, LEAD_STATUS, MODE_LABELS, rupees, scheduleText, TUTOR_STATUS,
} from '../../../lib/format'

const NAV = [
  { id: 'overview', label: 'Overview', icon: FiBarChart2 },
  { id: 'leads', label: 'Leads', icon: FiUsers },
  { id: 'operations', label: 'Operations', icon: FiActivity },
  { id: 'tutors', label: 'Tutors', icon: FiUserCheck },
  { id: 'finance', label: 'Finance', icon: FiDollarSign },
  { id: 'settings', label: 'Matching rules', icon: FiSettings },
  { id: 'audit', label: 'Audit log', icon: FiList },
]

const ENROLMENT_STATUS = { active: { label: 'Active', tone: 'green' }, paused: { label: 'Paused', tone: 'amber' }, completed: { label: 'Completed', tone: 'slate' }, cancelled: { label: 'Cancelled', tone: 'slate' } }

// Loads one admin endpoint; `version` forces a reload after changes elsewhere.
function useAdminData(path, version) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const load = useCallback(() => api(path, { role: 'admin' }).then(d => { setData(d); setError('') }).catch(e => setError(e.message)), [path])
  useEffect(() => { load() }, [load, version])
  return { data, error, reload: load }
}

function Console() {
  const params = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') || 'overview')
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion(v => v + 1), [])
  const { data: dash, error, message, busy, run, logout, reload } = usePortal('admin', '/api/admin/dashboard')
  const { masters } = useMasters()
  const [leadId, setLeadId] = useState(null)
  const [tutorId, setTutorId] = useState(null)
  const [newLead, setNewLead] = useState(false)

  useEffect(() => { reload() }, [version, reload])

  if (!dash || !masters) return error ? <div className="p-6"><Notice>{error}</Notice></div> : <PageLoader />
  const ops = dash.operations
  const nav = NAV.map(n => (n.id === 'operations' ? { ...n, count: ops.awaitingConfirmation + ops.noTutorQueue } : n.id === 'tutors' ? { ...n, count: dash.tutors.awaitingReview } : n))

  return (
    <AppShell portalLabel="Operations" user={{ name: 'Administrator', subtitle: 'Admin' }} navItems={nav} activeTab={tab} onTabChange={setTab} onLogout={logout}
      headerActions={<>
        <button type="button" className={btn.secondary} onClick={bump} aria-label="Refresh"><FiRefreshCw aria-hidden="true" /></button>
        <button type="button" className={btn.primary} onClick={() => setNewLead(true)}><FiPlus aria-hidden="true" /> New lead</button>
      </>}>
      <div className="space-y-6">
        <Notice>{error}</Notice>
        <Notice tone="success">{message}</Notice>

        {tab === 'overview' && <Overview dash={dash} goto={setTab} />}
        {tab === 'leads' && <LeadsTab version={version} masters={masters} onOpen={setLeadId} onNew={() => setNewLead(true)} />}
        {tab === 'operations' && <OperationsTab version={version} onOpenLead={setLeadId} onConfirm={id => run(() => api(`/api/admin/assignments/${id}/confirm`, { method: 'POST', role: 'admin' }), 'Tutor confirmed.').then(bump).catch(() => {})} busy={busy} onExpire={bump} />}
        {tab === 'tutors' && <TutorsTab version={version} onOpen={setTutorId} />}
        {tab === 'finance' && <FinanceTab version={version} masters={masters} run={run} busy={busy} onChanged={bump} />}
        {tab === 'settings' && <SettingsTab run={run} busy={busy} />}
        {tab === 'audit' && <AuditTab version={version} />}
      </div>

      <LeadWorkspace leadId={leadId} masters={masters} onClose={() => setLeadId(null)} onChanged={bump} />
      <TutorReview tutorId={tutorId} masters={masters} onClose={() => setTutorId(null)} onChanged={bump} />
      <NewLeadModal open={newLead} masters={masters} busy={busy} onClose={() => setNewLead(false)}
        onSubmit={body => run(() => api('/api/admin/leads', { method: 'POST', body, role: 'admin' }), 'Lead created.').then(lead => { setNewLead(false); bump(); setTab('leads'); setLeadId(lead.id) })} />
    </AppShell>
  )
}

function Overview({ dash, goto }) {
  const pipeline = ['new', 'contacted', 'qualified', 'matching', 'tutor_offered', 'tutor_accepted', 'demo_scheduled', 'demo_completed', 'converted', 'on_hold', 'lost', 'cancelled']
  const max = Math.max(1, ...pipeline.map(s => dash.leads.byStatus[s]))
  return (
    <>
      <SummaryTable items={[
        { label: 'Leads', value: dash.leads.total, hint: `${dash.leads.byStatus.new} new` },
        { label: 'Conversion rate', value: `${dash.conversionRate}%`, hint: `${dash.leads.byStatus.converted} converted` },
        { label: 'Active tutors', value: dash.tutors.byStatus.active || 0, hint: `${dash.tutors.awaitingReview} awaiting review` },
        { label: 'Active enrolments', value: dash.enrolments.active },
        { label: 'Collected', value: rupees(dash.finance.collected) },
        { label: 'Outstanding', value: rupees(dash.finance.outstanding), hint: dash.finance.overdue ? `${rupees(dash.finance.overdue)} overdue` : 'Nothing overdue', tone: dash.finance.overdue ? 'red' : undefined },
        { label: 'Open offers', value: dash.operations.openOffers, hint: `${dash.operations.awaitingConfirmation} awaiting confirmation`, tone: dash.operations.awaitingConfirmation ? 'orange' : undefined },
        { label: 'No tutor found', value: dash.operations.noTutorQueue, hint: `${dash.operations.upcomingDemos} demos in the next 7 days`, tone: dash.operations.noTutorQueue ? 'red' : undefined },
      ]} />
      <Card title="Lead pipeline" actions={<button type="button" className={btn.link} onClick={() => goto('leads')}>View leads</button>}>
        <SimpleTable rows={pipeline.map(st => ({ id: st, count: dash.leads.byStatus[st] }))} minWidth={480} columns={[
          { key: 'stage', header: 'Stage', render: r => <StatusBadge map={LEAD_STATUS} value={r.id} /> },
          { key: 'count', header: 'Leads', align: 'right', render: r => <span className="font-semibold tabular-nums">{r.count}</span> },
          { key: 'share', header: 'Share of all leads', render: r => (
            <span className="flex items-center gap-3">
              <span className="h-2 w-40 overflow-hidden rounded-full bg-gray-100"><span className="block h-full rounded-full bg-blue-600" style={{ width: `${(r.count / max) * 100}%` }} /></span>
              <span className="text-xs tabular-nums text-gray-600">{dash.leads.total ? Math.round((r.count / dash.leads.total) * 100) : 0}%</span>
            </span>
          ) },
        ]} />
      </Card>
    </>
  )
}

function LeadsTab({ version, masters, onOpen, onNew }) {
  const { data, error } = useAdminData('/api/admin/leads?limit=100', version)
  if (error) return <Notice>{error}</Notice>
  if (!data) return <PageLoader />
  return (
    <>
      {data.total > data.items.length && <Notice tone="info">Showing the latest {data.items.length} of {data.total} leads.</Notice>}
      <DataTable title="Leads" noun="leads" rows={data.items} rowKey={r => r.id}
        searchText={r => `${r.code} ${r.parentName} ${r.parentPhone} ${r.studentName} ${r.pincode || ''} ${r.subjects.join(' ')}`}
        searchPlaceholder="Search code, name, phone, pincode"
        toolbarExtra={<button type="button" className={btn.primary} onClick={onNew}><FiPlus aria-hidden="true" /> New lead</button>}
        filters={[
          { key: 'status', label: 'statuses', get: r => r.status, options: masters.leadStatuses.map(s => ({ value: s, label: LEAD_STATUS[s].label })) },
          { key: 'source', label: 'sources', get: r => r.source, options: masters.leadSources.map(s => ({ value: s, label: s })) },
          { key: 'mode', label: 'modes', get: r => r.mode, options: masters.leadModes.map(m => ({ value: m, label: MODE_LABELS[m] })) },
        ]}
        columns={[
          { key: 'code', header: 'Lead', sortable: true, sortValue: r => r.code, render: r => <button type="button" className="font-semibold text-blue-700 hover:underline" onClick={() => onOpen(r.id)}>{r.code}</button> },
          { key: 'parent', header: 'Parent / student', render: r => <span><span className="font-medium">{r.parentName}</span><br /><span className="text-xs text-gray-500">{r.studentName} · {classLabel(r.class)} {r.board}</span></span> },
          { key: 'subjects', header: 'Subjects', render: r => r.subjects.join(', ') },
          { key: 'where', header: 'Mode / area', render: r => `${MODE_LABELS[r.mode]}${r.pincode ? ` · ${r.pincode}` : ''}` },
          { key: 'status', header: 'Status', render: r => <span className="flex flex-col items-start gap-1"><StatusBadge map={LEAD_STATUS} value={r.status} />{r.noTutorFound && <span className="text-xs font-semibold text-red-700">No tutor</span>}</span> },
          { key: 'created', header: 'Created', sortable: true, sortValue: r => r.createdAt, render: r => <span className="text-xs">{formatDateTime(r.createdAt)}</span> },
          { key: 'open', header: '', sticky: true, render: r => <button type="button" className={btn.secondary} onClick={() => onOpen(r.id)}>Open</button> },
        ]}
        emptyMessage="No leads yet. Leads arrive from the parent enquiry form, or add one with New lead." />
    </>
  )
}

function OperationsTab({ version, onOpenLead, onConfirm, busy, onExpire }) {
  const { data, error } = useAdminData('/api/admin/operations', version)
  if (error) return <Notice>{error}</Notice>
  if (!data) return <PageLoader />
  const open = id => <button type="button" className={btn.secondary} onClick={() => onOpenLead(id)}>Open lead</button>
  const leadCol = { key: 'lead', header: 'Lead', render: r => <span className="whitespace-nowrap font-medium">{r.leadCode || r.code}</span> }
  return (
    <div className="space-y-4">
      <Card title={`Awaiting confirmation (${data.awaitingConfirmation.length})`} subtitle="Tutor accepted; confirm to share contact details">
        <SimpleTable rows={data.awaitingConfirmation} empty="Nothing to confirm" columns={[
          leadCol,
          { key: 'tutor', header: 'Tutor', render: a => a.tutorName },
          { key: 'score', header: 'Score', align: 'right', render: a => a.score },
          { key: 'distance', header: 'Distance', render: a => (a.distanceKm != null ? `${a.distanceKm} km` : 'Online') },
          { key: 'accepted', header: 'Accepted', render: a => <span className="whitespace-nowrap">{formatDateTime(a.respondedAt)}</span> },
          { key: 'act', header: '', align: 'right', render: a => <span className="inline-flex gap-2"><button type="button" className={btn.success} disabled={busy} onClick={() => onConfirm(a.id)}>Confirm</button>{open(a.leadId)}</span> },
        ]} />
      </Card>
      <Card title={`No tutor found (${data.noTutor.length})`} subtitle="Expand the search, switch to online or recruit">
        <SimpleTable rows={data.noTutor} empty="Every lead has candidates" columns={[
          leadCol,
          { key: 'parent', header: 'Parent / student', render: l => <span>{l.parentName}<br /><span className="text-xs text-gray-500">{l.studentName}</span></span> },
          { key: 'need', header: 'Requirement', render: l => `${classLabel(l.class)} ${l.board} · ${l.subjects.join(', ')}` },
          { key: 'where', header: 'Mode / area', render: l => `${MODE_LABELS[l.mode]}${l.pincode ? ` · ${l.pincode}` : ''}` },
          { key: 'status', header: 'Status', render: l => <StatusBadge map={LEAD_STATUS} value={l.status} /> },
          { key: 'act', header: '', align: 'right', render: l => open(l.id) },
        ]} />
      </Card>
      <Card title={`Open offers (${data.openOffers.length})`}>
        <SimpleTable rows={data.openOffers} empty="No offers waiting" columns={[
          leadCol,
          { key: 'tutor', header: 'Offered to', render: a => a.tutorName },
          { key: 'score', header: 'Score', align: 'right', render: a => a.score },
          { key: 'offered', header: 'Offered', render: a => <span className="whitespace-nowrap">{formatDateTime(a.offeredAt)}</span> },
          { key: 'left', header: 'Time left', render: a => <Countdown expiresAt={a.expiresAt} onExpire={onExpire} /> },
          { key: 'act', header: '', align: 'right', render: a => open(a.leadId) },
        ]} />
      </Card>
      <Card title={`Questions from tutors (${data.infoRequests.length})`}>
        <SimpleTable rows={data.infoRequests} empty="No questions" columns={[
          leadCol,
          { key: 'tutor', header: 'Tutor', render: a => a.tutorName },
          { key: 'q', header: 'Question', render: a => a.infoRequest },
          { key: 'left', header: 'Offer time left', render: a => <Countdown expiresAt={a.expiresAt} onExpire={onExpire} /> },
          { key: 'act', header: '', align: 'right', render: a => open(a.leadId) },
        ]} />
      </Card>
      <Card title={`Escalations (${data.escalations.length})`} subtitle="Repeated missed demos">
        <SimpleTable rows={data.escalations} empty="No escalations" columns={[
          leadCol,
          { key: 'parent', header: 'Parent', render: l => <span>{l.parentName}<br /><span className="text-xs text-gray-500">+91 {l.parentPhone}</span></span> },
          { key: 'need', header: 'Requirement', render: l => `${classLabel(l.class)} · ${l.subjects.join(', ')}` },
          { key: 'status', header: 'Status', render: l => <StatusBadge map={LEAD_STATUS} value={l.status} /> },
          { key: 'act', header: '', align: 'right', render: l => open(l.id) },
        ]} />
      </Card>
      <Card title={`Upcoming demos (${data.upcomingDemos.length})`}>
        <SimpleTable rows={data.upcomingDemos} empty="No demos scheduled" columns={[
          { key: 'when', header: 'When', render: d => <span className="whitespace-nowrap font-medium">{formatDateTime(d.scheduledAt)}</span> },
          leadCol,
          { key: 'tutor', header: 'Tutor', render: d => d.tutorName },
          { key: 'mode', header: 'Mode', render: d => MODE_LABELS[d.mode] },
          { key: 'where', header: 'Place / link', render: d => <span className="text-xs">{d.locationNote || '—'}</span> },
          { key: 'act', header: '', align: 'right', render: d => open(d.leadId) },
        ]} />
      </Card>
    </div>
  )
}

function TutorsTab({ version, onOpen }) {
  const { data, error } = useAdminData('/api/admin/tutors?limit=100', version)
  if (error) return <Notice>{error}</Notice>
  if (!data) return <PageLoader />
  return (
    <DataTable title="Tutors" noun="tutors" rows={data.items} rowKey={r => r.id}
      searchText={r => `${r.name} ${r.phone} ${r.email} ${r.pincode} ${r.subjects.join(' ')}`}
      filters={[{ key: 'status', label: 'statuses', get: r => r.status, options: Object.entries(TUTOR_STATUS).map(([value, v]) => ({ value, label: v.label })) }]}
      columns={[
        { key: 'name', header: 'Tutor', sortable: true, sortValue: r => r.name, render: r => <button type="button" className="text-left font-semibold text-blue-700 hover:underline" onClick={() => onOpen(r.id)}>{r.name}<br /><span className="text-xs font-normal text-gray-500">+91 {r.phone}</span></button> },
        { key: 'teaches', header: 'Teaches', render: r => <span className="text-xs">{r.subjects.join(', ')}<br />{r.classes.map(classLabel).join(', ')}</span> },
        { key: 'mode', header: 'Mode / area', render: r => `${r.modes.map(m => MODE_LABELS[m]).join(', ')} · ${r.pincode}` },
        { key: 'exp', header: 'Experience', sortable: true, sortValue: r => r.experienceYears, render: r => `${r.experienceYears} yrs` },
        { key: 'rating', header: 'Rating', sortable: true, sortValue: r => r.ratingAvg || 0, render: r => (r.ratingCount ? `${r.ratingAvg.toFixed(1)} (${r.ratingCount})` : '—') },
        { key: 'students', header: 'Students', render: r => r.activeStudents },
        { key: 'status', header: 'Status', render: r => <span className="flex flex-col gap-1"><StatusBadge map={TUTOR_STATUS} value={r.status} />{!r.acceptingLeads && <span className="text-xs text-amber-700">Paused leads</span>}</span> },
        { key: 'open', header: '', sticky: true, render: r => <button type="button" className={btn.secondary} onClick={() => onOpen(r.id)}>Review</button> },
      ]}
      emptyMessage="No tutors have registered yet." />
  )
}

function FinanceTab({ version, masters, run, busy, onChanged }) {
  const invoices = useAdminData('/api/admin/invoices?limit=100', version)
  const enrolments = useAdminData('/api/admin/enrolments?limit=100', version)
  const [paying, setPaying] = useState(null)
  const [invoiceFor, setInvoiceFor] = useState(null)
  if (invoices.error || enrolments.error) return <Notice>{invoices.error || enrolments.error}</Notice>
  if (!invoices.data || !enrolments.data) return <PageLoader />
  const post = (path, body, msg) => run(() => api(path, { method: 'POST', body, role: 'admin' }), msg).then(r => { onChanged(); return r })
  return (
    <div className="space-y-6">
      <Notice tone="info">No payment gateway is connected. Record UPI, bank, cash or cheque payments here when they arrive.</Notice>
      <DataTable title="Invoices" noun="invoices" rows={invoices.data.items} rowKey={r => r.id}
        searchText={r => `${r.number} ${r.parentName} ${r.studentName} ${r.periodLabel}`}
        filters={[{ key: 'status', label: 'statuses', get: r => r.status, options: Object.entries(INVOICE_STATUS).map(([value, v]) => ({ value, label: v.label })) },
          { key: 'overdue', label: 'invoices', get: r => (r.overdue ? 'overdue' : 'current'), options: [{ value: 'overdue', label: 'Overdue only' }, { value: 'current', label: 'Not overdue' }] }]}
        columns={[
          { key: 'number', header: 'Invoice', render: r => <span className="font-medium">{r.number}</span> },
          { key: 'who', header: 'Parent / student', render: r => <span>{r.parentName}<br /><span className="text-xs text-gray-500">{r.studentName}</span></span> },
          { key: 'period', header: 'Period', render: r => r.periodLabel },
          { key: 'amount', header: 'Amount', align: 'right', sortable: true, sortValue: r => r.amount, render: r => rupees(r.amount) },
          { key: 'outstanding', header: 'Outstanding', align: 'right', sortable: true, sortValue: r => r.outstanding, render: r => rupees(r.outstanding) },
          { key: 'due', header: 'Due', sortable: true, sortValue: r => r.dueDate, render: r => <span className={r.overdue ? 'font-semibold text-red-700' : ''}>{formatDate(r.dueDate)}</span> },
          { key: 'status', header: 'Status', render: r => <StatusBadge map={INVOICE_STATUS} value={r.status} /> },
          { key: 'act', header: '', sticky: true, render: r => (
            <span className="flex gap-2">
              {['pending', 'partial'].includes(r.status) && <button type="button" className={btn.primary} onClick={() => setPaying(r)}>Record payment</button>}
              {r.status === 'pending' && <button type="button" className={btn.danger} disabled={busy} onClick={() => { if (window.confirm(`Void ${r.number}?`)) post(`/api/admin/invoices/${r.id}/void`, undefined, 'Invoice voided.').catch(() => {}) }}>Void</button>}
            </span>
          ) },
        ]}
        emptyMessage="Invoices are created when a lead converts." />

      <DataTable title="Enrolments" noun="enrolments" rows={enrolments.data.items} rowKey={r => r.id}
        searchText={r => `${r.leadCode} ${r.studentName} ${r.parentName} ${r.tutorName}`}
        filters={[{ key: 'status', label: 'statuses', get: r => r.status, options: Object.entries(ENROLMENT_STATUS).map(([value, v]) => ({ value, label: v.label })) }]}
        columns={[
          { key: 'lead', header: 'Lead', render: r => r.leadCode },
          { key: 'student', header: 'Student / tutor', render: r => <span>{r.studentName}<br /><span className="text-xs text-gray-500">with {r.tutorName}</span></span> },
          { key: 'plan', header: 'Plan', render: r => `${rupees(r.feeAmount)} · ${r.plan.replace('_', ' ')}` },
          { key: 'schedule', header: 'Schedule', render: r => <span className="text-xs">{scheduleText(r.schedule)}</span> },
          { key: 'start', header: 'Start', render: r => formatDate(r.startDate) },
          { key: 'status', header: 'Status', render: r => <StatusBadge map={ENROLMENT_STATUS} value={r.status} /> },
          { key: 'act', header: '', sticky: true, render: r => (
            <span className="flex flex-wrap gap-2">
              {r.status === 'active' && <button type="button" className={btn.secondary} onClick={() => setInvoiceFor(r)}>New invoice</button>}
              {r.status === 'active' && <button type="button" className={btn.secondary} disabled={busy} onClick={() => post(`/api/admin/enrolments/${r.id}/status`, { status: 'paused' }, 'Enrolment paused.').catch(() => {})}>Pause</button>}
              {r.status === 'paused' && <button type="button" className={btn.success} disabled={busy} onClick={() => post(`/api/admin/enrolments/${r.id}/status`, { status: 'active' }, 'Enrolment resumed.').catch(() => {})}>Resume</button>}
              {['active', 'paused'].includes(r.status) && <button type="button" className={btn.danger} disabled={busy} onClick={() => { if (window.confirm('End this enrolment? Future classes will be cancelled.')) post(`/api/admin/enrolments/${r.id}/status`, { status: 'cancelled' }, 'Enrolment ended.').catch(() => {}) }}>End</button>}
            </span>
          ) },
        ]}
        emptyMessage="No enrolments yet." />

      <PaymentModal invoice={paying} masters={masters} busy={busy} onClose={() => setPaying(null)}
        onSubmit={body => post(`/api/admin/invoices/${paying.id}/payments`, body, 'Payment recorded.').then(() => setPaying(null))} />
      <InvoiceModal enrolment={invoiceFor} busy={busy} onClose={() => setInvoiceFor(null)}
        onSubmit={body => post('/api/admin/invoices', { enrolmentId: invoiceFor.id, ...body }, 'Invoice created.').then(() => setInvoiceFor(null))} />
    </div>
  )
}

function PaymentModal({ invoice, masters, busy, onClose, onSubmit }) {
  const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10)
  const [f, setF] = useState({})
  const [errors, setErrors] = useState({})
  useEffect(() => { if (invoice) { setF({ amount: invoice.outstanding, method: 'upi', reference: '', paidOn: today, notes: '' }); setErrors({}) } }, [invoice, today])
  const submit = () => onSubmit({ amount: Number(f.amount), method: f.method, paidOn: f.paidOn, ...(f.reference ? { reference: f.reference } : {}), ...(f.notes ? { notes: f.notes } : {}) })
    .catch(err => setErrors(err.fieldErrors ? err.fieldErrors() : {}))
  return (
    <Modal open={!!invoice} title={invoice ? `Record payment · ${invoice.number}` : ''} onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={busy || !f.amount} onClick={submit}>Record</button></>}>
      {invoice && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{invoice.parentName} · outstanding {rupees(invoice.outstanding)}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Amount (₹)" required type="number" min={1} max={invoice.outstanding} value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} error={errors.amount} />
            <TextInput label="Paid on" required type="date" max={today} value={f.paidOn} onChange={e => setF({ ...f, paidOn: e.target.value })} error={errors.paidOn} />
          </div>
          <ChipGroup label="Method" required single options={masters.paymentMethods.map(m => ({ value: m, label: m.replace('_', ' ') }))} value={f.method} onChange={v => setF({ ...f, method: v })} />
          <TextInput label="Reference" hint="UPI / bank reference or cheque number" value={f.reference} onChange={e => setF({ ...f, reference: e.target.value })} />
          <TextArea label="Notes" rows={2} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
        </div>
      )}
    </Modal>
  )
}

function InvoiceModal({ enrolment, busy, onClose, onSubmit }) {
  const [f, setF] = useState({ amount: '', periodLabel: '', dueDate: '' })
  const [errors, setErrors] = useState({})
  useEffect(() => { if (enrolment) { setF({ amount: enrolment.feeAmount, periodLabel: '', dueDate: '' }); setErrors({}) } }, [enrolment])
  return (
    <Modal open={!!enrolment} title="New invoice" onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button>
        <button type="button" className={btn.primary} disabled={busy || !f.amount || !f.periodLabel || !f.dueDate} onClick={() => onSubmit({ amount: Number(f.amount), periodLabel: f.periodLabel, dueDate: f.dueDate }).catch(err => setErrors(err.fieldErrors ? err.fieldErrors() : {}))}>Create invoice</button></>}>
      {enrolment && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{enrolment.studentName} with {enrolment.tutorName}</p>
          <TextInput label="Period" required placeholder="Fees for Dec 2026" value={f.periodLabel} onChange={e => setF({ ...f, periodLabel: e.target.value })} error={errors.periodLabel} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Amount (₹)" required type="number" min={1} value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} error={errors.amount} />
            <TextInput label="Due date" required type="date" value={f.dueDate} onChange={e => setF({ ...f, dueDate: e.target.value })} error={errors.dueDate} />
          </div>
        </div>
      )}
    </Modal>
  )
}

function SettingsTab({ run, busy }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api('/api/admin/settings', { role: 'admin' }).then(setData).catch(e => setError(e.message)) }, [])
  if (error) return <Notice>{error}</Notice>
  if (!data) return <PageLoader />
  return <SettingsForm settings={data.settings} defaults={data.defaults} busy={busy}
    onSave={body => run(() => api('/api/admin/settings', { method: 'PUT', body, role: 'admin' }), 'Matching rules saved. They apply to the next matching run.').then(setData).catch(() => {})} />
}

function AuditTab({ version }) {
  const [page, setPage] = useState(1)
  const { data, error } = useAdminData(`/api/admin/audit?limit=50&page=${page}`, version)
  if (error) return <Notice>{error}</Notice>
  if (!data) return <PageLoader />
  const pages = Math.max(1, Math.ceil(data.total / data.limit))
  return (
    <Card title="Audit log" subtitle={`${data.total} recorded actions. Entries cannot be edited or deleted.`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-3 py-2">When</th><th className="px-3 py-2">Who</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Record</th><th className="px-3 py-2">Details</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data.items.map(a => (
              <tr key={a.id} className="align-top">
                <td className="whitespace-nowrap px-3 py-2 text-xs">{formatDateTime(a.createdAt)}</td>
                <td className="px-3 py-2 text-xs">{a.actor.split(':')[0]}</td>
                <td className="px-3 py-2 font-medium">{a.action}</td>
                <td className="px-3 py-2 text-xs">{a.entity}</td>
                <td className="px-3 py-2"><code className="block max-w-md truncate text-xs text-gray-600" title={a.details ? JSON.stringify(a.details) : ''}>{a.details ? JSON.stringify(a.details) : '—'}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <button type="button" className={btn.secondary} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button type="button" className={btn.secondary} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </Card>
  )
}

function NewLeadModal({ open, masters, busy, onClose, onSubmit }) {
  const blank = { name: '', phone: '', relationship: 'Parent', studentName: '', studentClass: '', board: '', subjects: [], mode: '', address: '', pincode: '', preferredDays: [], preferredSlots: [], source: 'bda', note: '' }
  const [f, setF] = useState(blank)
  const [errors, setErrors] = useState({})
  useEffect(() => { if (open) { setF(blank); setErrors({}) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const submit = () => {
    const body = {
      name: f.name.trim(), phone: f.phone, relationship: f.relationship, studentName: f.studentName.trim(), studentClass: f.studentClass, board: f.board,
      subjects: f.subjects, mode: f.mode, preferredDays: f.preferredDays, preferredSlots: f.preferredSlots, source: f.source,
      ...(f.address ? { address: f.address } : {}), ...(f.pincode ? { pincode: f.pincode } : {}), ...(f.note ? { note: f.note } : {}),
    }
    onSubmit(body).catch(err => setErrors(err.fieldErrors ? err.fieldErrors() : {}))
  }
  return (
    <Modal open={open} title="New lead (phone, WhatsApp or walk-in)" onClose={onClose} wide
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={busy} onClick={submit}>Create lead</button></>}>
      <div className="space-y-4">
        <Notice tone="info">Confirm consent to be contacted with the parent before saving. If the number already has an account, the lead is added to it.</Notice>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextInput label="Parent name" required value={f.name} onChange={e => set('name', e.target.value)} error={errors.name} />
          <TextInput label="Mobile" required inputMode="numeric" maxLength={10} value={f.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} error={errors.phone} />
          <Select label="Relationship" required options={masters.relationships} value={f.relationship} onChange={e => set('relationship', e.target.value)} error={errors.relationship} />
          <TextInput label="Student name" required value={f.studentName} onChange={e => set('studentName', e.target.value)} error={errors.studentName} />
          <Select label="Class" required options={masters.classes.map(c => ({ value: c, label: classLabel(c) }))} value={f.studentClass} onChange={e => set('studentClass', e.target.value)} error={errors.studentClass} />
          <Select label="Board" required options={masters.boards} value={f.board} onChange={e => set('board', e.target.value)} error={errors.board} />
        </div>
        <ChipGroup label="Subjects" required options={masters.subjects} value={f.subjects} onChange={v => set('subjects', v)} error={errors.subjects} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Mode" required options={masters.leadModes.map(m => ({ value: m, label: MODE_LABELS[m] }))} value={f.mode} onChange={e => set('mode', e.target.value)} error={errors.mode} />
          <Select label="Source" required options={masters.leadSources} value={f.source} onChange={e => set('source', e.target.value)} error={errors.source} />
          <TextInput label="Pincode" inputMode="numeric" maxLength={6} value={f.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))} error={errors.pincode} />
        </div>
        {f.mode && f.mode !== 'online' && <TextInput label="Address" required value={f.address} onChange={e => set('address', e.target.value)} error={errors.address} />}
        <ChipGroup label="Days" required options={masters.days.map(d => ({ value: d, label: DAY_LABELS[d] }))} value={f.preferredDays} onChange={v => set('preferredDays', v)} error={errors.preferredDays} />
        <ChipGroup label="Times" required options={masters.slots} value={f.preferredSlots} onChange={v => set('preferredSlots', v)} error={errors.preferredSlots} />
        <TextArea label="Call note" rows={2} value={f.note} onChange={e => set('note', e.target.value)} />
      </div>
    </Modal>
  )
}

export default function AdminConsolePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Console />
    </Suspense>
  )
}
