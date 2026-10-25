'use client'

import { ChipGroup, Select, TextArea, TextInput } from '@/shared/ui/Form'
import { DAY_LABELS, MODE_LABELS } from '@/shared/lib/format'

// The tuition requirement: subjects, mode, area, days and times. Used by the staff forms that
// create a tuition request (new lead, or a request for a parent who already has an account).
export const blankRequirement = { subjects: [], mode: '', address: '', pincode: '', preferredDays: [], preferredSlots: [], source: 'bda', note: '' }

export function requirementBody(f) {
  return {
    subjects: f.subjects, mode: f.mode, preferredDays: f.preferredDays, preferredSlots: f.preferredSlots, source: f.source,
    ...(f.address ? { address: f.address } : {}), ...(f.pincode ? { pincode: f.pincode } : {}), ...(f.note ? { note: f.note } : {}),
  }
}

export function RequirementFields({ f, set, errors, masters, addressHint }) {
  return (
    <>
      <ChipGroup label="Subjects" required options={masters.subjects} value={f.subjects} onChange={v => set('subjects', v)} error={errors.subjects} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Mode" required options={masters.leadModes.map(m => ({ value: m, label: MODE_LABELS[m] }))} value={f.mode} onChange={e => set('mode', e.target.value)} error={errors.mode} />
        <Select label="Source" required options={masters.leadSources} value={f.source} onChange={e => set('source', e.target.value)} error={errors.source} />
        <TextInput label="Pincode" inputMode="numeric" maxLength={6} value={f.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))} error={errors.pincode} />
      </div>
      {f.mode && f.mode !== 'online' && <TextInput label="Address" required={!addressHint} hint={addressHint} value={f.address} onChange={e => set('address', e.target.value)} error={errors.address} />}
      <ChipGroup label="Days" required options={masters.days.map(d => ({ value: d, label: DAY_LABELS[d] }))} value={f.preferredDays} onChange={v => set('preferredDays', v)} error={errors.preferredDays} />
      <ChipGroup label="Times" required options={masters.slots} value={f.preferredSlots} onChange={v => set('preferredSlots', v)} error={errors.preferredSlots} />
      <TextArea label="Call note" rows={2} value={f.note} onChange={e => set('note', e.target.value)} />
    </>
  )
}
