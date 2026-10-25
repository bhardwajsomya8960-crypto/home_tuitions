'use client'

import { useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import SimpleTable from '@/shared/ui/SimpleTable'
import { btn, Card } from '@/shared/ui/Card'
import { Notice, TextInput } from '@/shared/ui/Form'
import { formatDate } from '@/shared/lib/format'

export const istToday = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10)

export const dayCount = (from, to) => Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1

// Holidays and leave. Saved straight away; while on leave the tutor is not offered new leads.
export function TimeOffCard({ timeOff, busy, onSave }) {
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
