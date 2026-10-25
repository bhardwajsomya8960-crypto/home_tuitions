'use client'

import { useEffect, useState } from 'react'
import Modal from '@/shared/ui/Modal'
import { btn } from '@/shared/ui/Card'
import { Checkbox, TextArea } from '@/shared/ui/Form'
import { formatDate } from '@/shared/lib/format'

export function AttendanceModal({ session, busy, onClose, onSubmit }) {
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
