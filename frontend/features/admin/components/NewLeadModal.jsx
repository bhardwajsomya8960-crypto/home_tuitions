'use client'

import { useEffect, useState } from 'react'
import Modal from '@/shared/ui/Modal'
import { btn } from '@/shared/ui/Card'
import { ChipGroup, Notice, Select, TextArea, TextInput } from '@/shared/ui/Form'
import { classLabel, DAY_LABELS, MODE_LABELS } from '@/shared/lib/format'

export function NewLeadModal({ open, masters, busy, onClose, onSubmit }) {
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
