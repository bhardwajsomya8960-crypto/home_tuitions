'use client'

import { useEffect, useState } from 'react'
import Modal from '@/shared/ui/Modal'
import WeeklyHours, { hoursProblem } from '@/shared/ui/WeeklyHours'
import { formErrors } from '@/shared/lib/api'
import { classLabel } from '@/shared/lib/format'
import { btn } from '@/shared/ui/Card'
import { ChipGroup, Notice, Select, TextArea, TextInput } from '@/shared/ui/Form'

const blank = {
  name: '', phone: '', gender: '', email: '', qualification: '', college: '', experienceYears: '',
  subjects: [], classes: [], modes: [], boards: [], languages: [], address: '', pincode: '',
  serviceRadiusKm: '', availability: [], feeMin: '', feeMax: '', bio: '',
}

// A tutor profile created by staff from a call. It starts as pending: upload their documents
// from the tutor review window, then verify and activate as usual.
export function NewTutorModal({ open, masters, busy, onClose, onSubmit, initial, enquiryId }) {
  const [f, setF] = useState(blank)
  const [errors, setErrors] = useState({})
  useEffect(() => { if (open) { setF({ ...blank, ...(initial || {}) }); setErrors({}) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const submit = () => {
    if (f.availability.length) {
      const problem = hoursProblem(f.availability)
      if (problem) return setErrors({ availability: problem })
    }
    const body = { name: f.name.trim(), phone: f.phone, gender: f.gender, subjects: f.subjects, classes: f.classes, modes: f.modes, ...(enquiryId ? { enquiryId } : {}) }
    for (const k of ['email', 'qualification', 'college', 'address', 'pincode', 'bio']) if (f[k].trim()) body[k] = f[k].trim()
    for (const k of ['experienceYears', 'serviceRadiusKm', 'feeMin', 'feeMax']) if (f[k] !== '') body[k] = Number(f[k])
    for (const k of ['boards', 'languages', 'availability']) if (f[k].length) body[k] = f[k]
    onSubmit(body).catch(err => setErrors(formErrors(err)))
  }

  const digits = (k, max) => e => set(k, e.target.value.replace(/\D/g, '').slice(0, max))
  return (
    <Modal open={open} wide title="New tutor" onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={busy} onClick={submit}>Create tutor</button></>}>
      <div className="space-y-5">
        <Notice>{errors._form}</Notice>
        <Notice tone="info">The tutor starts as pending. Upload their documents from the tutor window, then verify and activate them. They can sign in later with a code sent to this number.</Notice>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Name" required value={f.name} onChange={e => set('name', e.target.value)} error={errors.name} />
          <TextInput label="Mobile" required inputMode="numeric" maxLength={10} value={f.phone} onChange={digits('phone', 10)} error={errors.phone} />
          <TextInput label="Email" type="email" value={f.email} onChange={e => set('email', e.target.value)} error={errors.email} />
          <Select label="Highest qualification" options={masters.qualifications} value={f.qualification} onChange={e => set('qualification', e.target.value)} error={errors.qualification} />
          <TextInput label="College or university" value={f.college} onChange={e => set('college', e.target.value)} error={errors.college} />
          <TextInput label="Years of experience" inputMode="numeric" value={f.experienceYears} onChange={digits('experienceYears', 2)} error={errors.experienceYears} />
        </div>
        <ChipGroup label="Gender" required single options={masters.genders} value={f.gender} onChange={v => set('gender', v)} error={errors.gender} />
        <ChipGroup label="Subjects" required options={masters.subjects} value={f.subjects} onChange={v => set('subjects', v)} error={errors.subjects} />
        <ChipGroup label="Classes" required options={masters.classes.map(c => ({ value: c, label: classLabel(c) }))} value={f.classes} onChange={v => set('classes', v)} error={errors.classes} />
        <ChipGroup label="Teaching mode" required options={masters.tutorModes.map(m => ({ value: m, label: m === 'home' ? "At the student's home" : 'Online' }))} value={f.modes} onChange={v => set('modes', v)} error={errors.modes} />
        <ChipGroup label="Boards" options={masters.boards} value={f.boards} onChange={v => set('boards', v)} error={errors.boards} />
        <ChipGroup label="Teaching languages" options={masters.languages} value={f.languages} onChange={v => set('languages', v)} error={errors.languages} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextInput label="Pincode" inputMode="numeric" maxLength={6} value={f.pincode} onChange={digits('pincode', 6)} error={errors.pincode} />
          <TextInput label="Travel up to (km)" inputMode="numeric" hint="For home tuition" value={f.serviceRadiusKm} onChange={digits('serviceRadiusKm', 2)} error={errors.serviceRadiusKm} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput label="Fee from (₹/hr)" inputMode="numeric" value={f.feeMin} onChange={digits('feeMin', 6)} error={errors.feeMin} />
            <TextInput label="Fee to (₹/hr)" inputMode="numeric" value={f.feeMax} onChange={digits('feeMax', 6)} error={errors.feeMax} />
          </div>
        </div>
        <TextInput label="Address" hint="Needed to match home tuition by distance" value={f.address} onChange={e => set('address', e.target.value)} error={errors.address} />
        <WeeklyHours days={masters.days} value={f.availability} onChange={v => set('availability', v)} error={errors.availability} hint="Optional. Without hours the tutor is not offered automatically, but you can still assign them by hand." />
        <TextArea label="About the tutor" value={f.bio} onChange={e => set('bio', e.target.value)} error={errors.bio} />
      </div>
    </Modal>
  )
}
