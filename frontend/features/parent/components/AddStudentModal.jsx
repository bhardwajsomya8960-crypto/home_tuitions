'use client'

import { useEffect, useState } from 'react'
import Modal from '@/shared/ui/Modal'
import { btn } from '@/shared/ui/Card'
import { Select, TextInput } from '@/shared/ui/Form'
import { classLabel } from '@/shared/lib/format'

export function AddStudentModal({ open, onClose, masters, onSubmit, busy }) {
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
