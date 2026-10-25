'use client'

import { useEffect, useState } from 'react'
import DataTable from '@/shared/data/DataTable'
import Modal from '@/shared/ui/Modal'
import { StatusBadge } from '@/shared/ui/Badge'
import { btn, PageLoader } from '@/shared/ui/Card'
import { ChipGroup, Notice, TextArea, TextInput } from '@/shared/ui/Form'
import { api } from '@/shared/lib/api'
import { ENROLMENT_STATUS, formatDate, INVOICE_STATUS, rupees, scheduleText } from '@/shared/lib/format'
import { useAdminData } from '@/features/admin/hooks/useAdminData'
import { ADMIN_API } from '@/features/admin/api/endpoints'

export function FinanceTab({ version, masters, run, busy, onChanged }) {
  const invoices = useAdminData(ADMIN_API.invoicesList, version)
  const enrolments = useAdminData(ADMIN_API.enrolmentsList, version)
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
          { key: 'who', header: 'Parent / student', render: r => <span>{r.parentName}<br /><span className="text-xs text-sage">{r.studentName}</span></span> },
          { key: 'period', header: 'Period', render: r => r.periodLabel },
          { key: 'amount', header: 'Amount', align: 'right', sortable: true, sortValue: r => r.amount, render: r => rupees(r.amount) },
          { key: 'outstanding', header: 'Outstanding', align: 'right', sortable: true, sortValue: r => r.outstanding, render: r => rupees(r.outstanding) },
          { key: 'due', header: 'Due', sortable: true, sortValue: r => r.dueDate, render: r => <span className={r.overdue ? 'font-semibold text-red-700' : ''}>{formatDate(r.dueDate)}</span> },
          { key: 'status', header: 'Status', render: r => <StatusBadge map={INVOICE_STATUS} value={r.status} /> },
          { key: 'act', header: '', sticky: true, render: r => (
            <span className="flex gap-2">
              {['pending', 'partial'].includes(r.status) && <button type="button" className={btn.primary} onClick={() => setPaying(r)}>Record payment</button>}
              {r.status === 'pending' && <button type="button" className={btn.danger} disabled={busy} onClick={() => { if (window.confirm(`Void ${r.number}?`)) post(ADMIN_API.invoiceAction(r.id, 'void'), undefined, 'Invoice voided.').catch(() => {}) }}>Void</button>}
            </span>
          ) },
        ]}
        emptyMessage="Invoices are created when a lead converts." />

      <DataTable title="Enrolments" noun="enrolments" rows={enrolments.data.items} rowKey={r => r.id}
        searchText={r => `${r.leadCode} ${r.studentName} ${r.parentName} ${r.tutorName}`}
        filters={[{ key: 'status', label: 'statuses', get: r => r.status, options: Object.entries(ENROLMENT_STATUS).map(([value, v]) => ({ value, label: v.label })) }]}
        columns={[
          { key: 'lead', header: 'Lead', render: r => r.leadCode },
          { key: 'student', header: 'Student / tutor', render: r => <span>{r.studentName}<br /><span className="text-xs text-sage">with {r.tutorName}</span></span> },
          { key: 'plan', header: 'Plan', render: r => `${rupees(r.feeAmount)} · ${r.plan.replace('_', ' ')}` },
          { key: 'schedule', header: 'Schedule', render: r => <span className="text-xs">{scheduleText(r.schedule)}</span> },
          { key: 'start', header: 'Start', render: r => formatDate(r.startDate) },
          { key: 'status', header: 'Status', render: r => <StatusBadge map={ENROLMENT_STATUS} value={r.status} /> },
          { key: 'act', header: '', sticky: true, render: r => (
            <span className="flex flex-wrap gap-2">
              {r.status === 'active' && <button type="button" className={btn.secondary} onClick={() => setInvoiceFor(r)}>New invoice</button>}
              {r.status === 'active' && <button type="button" className={btn.secondary} disabled={busy} onClick={() => post(ADMIN_API.enrolmentStatus(r.id), { status: 'paused' }, 'Enrolment paused.').catch(() => {})}>Pause</button>}
              {r.status === 'paused' && <button type="button" className={btn.success} disabled={busy} onClick={() => post(ADMIN_API.enrolmentStatus(r.id), { status: 'active' }, 'Enrolment resumed.').catch(() => {})}>Resume</button>}
              {['active', 'paused'].includes(r.status) && <button type="button" className={btn.danger} disabled={busy} onClick={() => { if (window.confirm('End this enrolment? Future classes will be cancelled.')) post(ADMIN_API.enrolmentStatus(r.id), { status: 'cancelled' }, 'Enrolment ended.').catch(() => {}) }}>End</button>}
            </span>
          ) },
        ]}
        emptyMessage="No enrolments yet." />

      <PaymentModal invoice={paying} masters={masters} busy={busy} onClose={() => setPaying(null)}
        onSubmit={body => post(ADMIN_API.invoiceAction(paying.id, 'payments'), body, 'Payment recorded.').then(() => setPaying(null))} />
      <InvoiceModal enrolment={invoiceFor} busy={busy} onClose={() => setInvoiceFor(null)}
        onSubmit={body => post(ADMIN_API.invoices, { enrolmentId: invoiceFor.id, ...body }, 'Invoice created.').then(() => setInvoiceFor(null))} />
    </div>
  )
}

export function PaymentModal({ invoice, masters, busy, onClose, onSubmit }) {
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
          <p className="text-sm text-sage">{invoice.parentName} · outstanding {rupees(invoice.outstanding)}</p>
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

export function InvoiceModal({ enrolment, busy, onClose, onSubmit }) {
  const [f, setF] = useState({ amount: '', periodLabel: '', dueDate: '' })
  const [errors, setErrors] = useState({})
  useEffect(() => { if (enrolment) { setF({ amount: enrolment.feeAmount, periodLabel: '', dueDate: '' }); setErrors({}) } }, [enrolment])
  return (
    <Modal open={!!enrolment} title="New invoice" onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button>
        <button type="button" className={btn.primary} disabled={busy || !f.amount || !f.periodLabel || !f.dueDate} onClick={() => onSubmit({ amount: Number(f.amount), periodLabel: f.periodLabel, dueDate: f.dueDate }).catch(err => setErrors(err.fieldErrors ? err.fieldErrors() : {}))}>Create invoice</button></>}>
      {enrolment && (
        <div className="space-y-4">
          <p className="text-sm text-sage">{enrolment.studentName} with {enrolment.tutorName}</p>
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
