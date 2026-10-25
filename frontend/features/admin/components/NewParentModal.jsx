'use client'

import { useEffect, useState } from 'react'
import Modal from '@/shared/ui/Modal'
import { formErrors } from '@/shared/lib/api'
import { btn } from '@/shared/ui/Card'
import { Notice, Select, TextInput } from '@/shared/ui/Form'

// A parent account created by staff. They can sign in later with a code sent to this number.
export function NewParentModal({ open, masters, busy, onClose, onSubmit, initial, enquiryId }) {
  const blank = { name: '', phone: '', email: '', relationship: 'Parent', address: '', pincode: '' }
  const [f, setF] = useState(blank)
  const [errors, setErrors] = useState({})
  useEffect(() => { if (open) { setF({ ...blank, ...(initial || {}) }); setErrors({}) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const submit = () => {
    const body = { name: f.name.trim(), phone: f.phone, relationship: f.relationship, ...(enquiryId ? { enquiryId } : {}) }
    for (const k of ['email', 'address', 'pincode']) if (f[k].trim()) body[k] = f[k].trim()
    onSubmit(body).catch(err => setErrors(formErrors(err)))
  }
  return (
    <Modal open={open} title="New parent" onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={busy} onClick={submit}>Create parent</button></>}>
      <div className="space-y-4">
        <Notice>{errors._form}</Notice>
        <Notice tone="info">Confirm with the parent that they are happy to be contacted. They can sign in later with a code sent to this number; no password is needed.</Notice>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Name" required value={f.name} onChange={e => set('name', e.target.value)} error={errors.name} />
          <TextInput label="Mobile" required inputMode="numeric" maxLength={10} value={f.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} error={errors.phone} />
          <Select label="Relationship" required options={masters.relationships} value={f.relationship} onChange={e => set('relationship', e.target.value)} error={errors.relationship} />
          <TextInput label="Email" type="email" value={f.email} onChange={e => set('email', e.target.value)} error={errors.email} />
          <TextInput label="Pincode" inputMode="numeric" maxLength={6} value={f.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))} error={errors.pincode} />
        </div>
        <TextInput label="Address" hint="Used for home tuition requests" value={f.address} onChange={e => set('address', e.target.value)} error={errors.address} />
      </div>
    </Modal>
  )
}
