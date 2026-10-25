'use client'

import { useEffect, useState } from 'react'
import Modal from '@/shared/ui/Modal'
import { formErrors } from '@/shared/lib/api'
import { btn } from '@/shared/ui/Card'
import { Notice, Select, TextInput } from '@/shared/ui/Form'
import { classLabel } from '@/shared/lib/format'
import { blankRequirement, RequirementFields, requirementBody } from '@/features/admin/components/RequirementFields'

// A lead taken on the phone or WhatsApp: parent, student and requirement in one form. If the
// number already has an account, the lead is added to it. `initial` prefills fields (for example
// from a website enquiry) and `enquiryId` links that enquiry, which is then marked converted.
export function NewLeadModal({ open, masters, busy, onClose, onSubmit, initial, enquiryId }) {
  const blank = { name: '', phone: '', relationship: 'Parent', studentName: '', studentClass: '', board: '', ...blankRequirement }
  const [f, setF] = useState(blank)
  const [errors, setErrors] = useState({})
  useEffect(() => { if (open) { setF({ ...blank, ...(initial || {}) }); setErrors({}) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const submit = () => {
    const body = {
      name: f.name.trim(), phone: f.phone, relationship: f.relationship, studentName: f.studentName.trim(), studentClass: f.studentClass, board: f.board,
      ...requirementBody(f), ...(enquiryId ? { enquiryId } : {}),
    }
    onSubmit(body).catch(err => setErrors(formErrors(err)))
  }
  return (
    <Modal open={open} title={enquiryId ? 'New tuition request from enquiry' : 'New lead (phone, WhatsApp or walk-in)'} onClose={onClose} wide
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={busy} onClick={submit}>Create lead</button></>}>
      <div className="space-y-4">
        <Notice>{errors._form}</Notice>
        <Notice tone="info">Confirm consent to be contacted with the parent before saving. If the number already has an account, the lead is added to it.</Notice>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextInput label="Parent name" required value={f.name} onChange={e => set('name', e.target.value)} error={errors.name} />
          <TextInput label="Mobile" required inputMode="numeric" maxLength={10} value={f.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} error={errors.phone} />
          <Select label="Relationship" required options={masters.relationships} value={f.relationship} onChange={e => set('relationship', e.target.value)} error={errors.relationship} />
          <TextInput label="Student name" required value={f.studentName} onChange={e => set('studentName', e.target.value)} error={errors.studentName} />
          <Select label="Class" required options={masters.classes.map(c => ({ value: c, label: classLabel(c) }))} value={f.studentClass} onChange={e => set('studentClass', e.target.value)} error={errors.studentClass} />
          <Select label="Board" required options={masters.boards} value={f.board} onChange={e => set('board', e.target.value)} error={errors.board} />
        </div>
        <RequirementFields f={f} set={set} errors={errors} masters={masters} />
      </div>
    </Modal>
  )
}
