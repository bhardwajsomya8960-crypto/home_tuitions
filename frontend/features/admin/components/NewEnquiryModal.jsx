'use client'

import { useEffect, useState } from 'react'
import Modal from '@/shared/ui/Modal'
import { formErrors } from '@/shared/lib/api'
import { btn } from '@/shared/ui/Card'
import { Notice, Select, TextArea, TextInput } from '@/shared/ui/Form'

// Staff noting a call or WhatsApp message as an enquiry, to work on later like website ones.
export function NewEnquiryModal({ open, masters, busy, onClose, onSubmit }) {
  const blank = { kind: 'parent', phone: '', name: '', role: '', level: '', message: '', source: 'whatsapp' }
  const [f, setF] = useState(blank)
  const [errors, setErrors] = useState({})
  useEffect(() => { if (open) { setF(blank); setErrors({}) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const submit = () => {
    const body = { kind: f.kind, phone: f.phone, source: f.source }
    for (const k of ['name', 'level', 'message']) if (f[k].trim()) body[k] = f[k].trim()
    if (f.kind === 'parent' && f.role) body.role = f.role
    onSubmit(body).catch(err => setErrors(formErrors(err)))
  }
  return (
    <Modal open={open} title="Add enquiry" onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={busy} onClick={submit}>Save enquiry</button></>}>
      <div className="space-y-4">
        <Notice>{errors._form}</Notice>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Type" required placeholder="Choose…" options={[{ value: 'parent', label: 'Parent / student' }, { value: 'tutor', label: 'Tutor' }]} value={f.kind} onChange={e => set('kind', e.target.value)} />
          <TextInput label="Mobile" required inputMode="numeric" maxLength={10} value={f.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} error={errors.phone} />
          <TextInput label="Name" value={f.name} onChange={e => set('name', e.target.value)} error={errors.name} />
          <Select label="Came in via" options={masters.leadSources} value={f.source} onChange={e => set('source', e.target.value)} />
          {f.kind === 'parent' && <Select label="They are" placeholder="Not known" options={[{ value: 'parent', label: 'A parent' }, { value: 'student', label: 'A student' }]} value={f.role} onChange={e => set('role', e.target.value)} />}
          <Select label="Level" placeholder="Not known" options={masters.enquiryLevels} value={f.level} onChange={e => set('level', e.target.value)} />
        </div>
        <TextArea label="Message" rows={3} maxLength={1000} value={f.message} onChange={e => set('message', e.target.value)} />
      </div>
    </Modal>
  )
}
