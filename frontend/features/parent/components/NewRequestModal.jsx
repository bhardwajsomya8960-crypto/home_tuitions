'use client'

import { useEffect, useState } from 'react'
import Modal from '@/shared/ui/Modal'
import { btn } from '@/shared/ui/Card'
import { ChipGroup, Select, TextArea, TextInput } from '@/shared/ui/Form'
import { classLabel, DAY_LABELS, MODE_LABELS } from '@/shared/lib/format'

export function NewRequestModal({ open, onClose, masters, students, parent, onSubmit, busy }) {
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
