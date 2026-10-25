'use client'

import { useEffect, useState } from 'react'
import DataTable from '@/shared/data/DataTable'
import { StatusBadge } from '@/shared/ui/Badge'
import { btn, PageLoader } from '@/shared/ui/Card'
import { Notice } from '@/shared/ui/Form'
import { api } from '@/shared/lib/api'
import { formatDate, SESSION_STATUS, SLOT_SHORT, weekday } from '@/shared/lib/format'
import { PARENT_API } from '@/features/parent/api/endpoints'

export function ClassesTab({ run }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const load = () => api(PARENT_API.classes, { role: 'parent' }).then(r => setRows(r.items)).catch(e => setError(e.message))
  useEffect(() => { load() }, [])
  if (error) return <Notice>{error}</Notice>
  if (!rows) return <PageLoader />
  const ack = id => run(() => api(PARENT_API.acknowledgeClass(id), { method: 'POST', role: 'parent' }), 'Thanks for confirming.').then(load).catch(() => {})
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
