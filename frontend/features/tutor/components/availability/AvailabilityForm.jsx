'use client'

import { useState } from 'react'
import WeeklyHours, { hoursProblem } from '@/shared/ui/WeeklyHours'
import { btn, Card } from '@/shared/ui/Card'
import { Checkbox, ChipGroup, TextArea, TextInput } from '@/shared/ui/Form'
import { classLabel, MODE_LABELS } from '@/shared/lib/format'
import { TimeOffCard } from '@/features/tutor/components/availability/TimeOffCard'

export function AvailabilityForm({ tutor, masters, busy, onSave, onSaveTimeOff }) {
  const [f, setF] = useState(() => ({
    availability: tutor.availability, acceptingLeads: tutor.acceptingLeads, demoAvailable: tutor.demoAvailable,
    serviceRadiusKm: tutor.serviceRadiusKm, feeMin: tutor.feeMin ?? '', feeMax: tutor.feeMax ?? '', bio: tutor.bio,
    subjects: tutor.subjects, classes: tutor.classes, modes: tutor.modes,
  }))
  const [errors, setErrors] = useState({})
  const save = () => {
    const e = {}
    const hours = hoursProblem(f.availability)
    if (hours) e.availability = hours
    if (f.bio.trim().length < 50) e.bio = 'Write at least 50 characters'
    if (!f.subjects.length) e.subjects = 'Choose at least one subject'
    if (!f.classes.length) e.classes = 'Choose at least one class'
    if (!f.modes.length) e.modes = 'Choose at least one mode'
    setErrors(e)
    if (Object.keys(e).length) return
    onSave({
      availability: f.availability, acceptingLeads: f.acceptingLeads, demoAvailable: f.demoAvailable, serviceRadiusKm: Number(f.serviceRadiusKm),
      bio: f.bio.trim(), subjects: f.subjects, classes: f.classes, modes: f.modes,
      ...(f.feeMin !== '' ? { feeMin: Number(f.feeMin) } : {}), ...(f.feeMax !== '' ? { feeMax: Number(f.feeMax) } : {}),
    }).catch(err => setErrors(err.fieldErrors ? err.fieldErrors() : {}))
  }
  return (
    <div className="space-y-4">
      <Card title="Lead preferences">
        <div className="space-y-3">
          <Checkbox checked={f.acceptingLeads} onChange={v => setF({ ...f, acceptingLeads: v })} label="Send me new lead offers" />
          <Checkbox checked={f.demoAvailable} onChange={v => setF({ ...f, demoAvailable: v })} label="I can give free demo classes" />
          {f.modes.includes('home') && <TextInput className="max-w-xs" label="Home tuition travel distance (km)" type="number" min={1} max={50} value={f.serviceRadiusKm} onChange={e => setF({ ...f, serviceRadiusKm: e.target.value })} error={errors.serviceRadiusKm} />}
        </div>
      </Card>
      <Card title="When you can teach" subtitle="We only offer you leads at times you are free. Classes you already teach are taken out automatically.">
        <WeeklyHours days={masters.days} value={f.availability} onChange={v => setF({ ...f, availability: v })} error={errors.availability} />
      </Card>
      <TimeOffCard timeOff={tutor.timeOff || []} busy={busy} onSave={onSaveTimeOff} />
      <Card title="What you teach">
        <div className="space-y-4">
          <ChipGroup label="Subjects" options={masters.subjects} value={f.subjects} onChange={v => setF({ ...f, subjects: v })} error={errors.subjects} />
          <ChipGroup label="Classes" options={masters.classes.map(c => ({ value: c, label: classLabel(c) }))} value={f.classes} onChange={v => setF({ ...f, classes: v })} error={errors.classes} />
          <ChipGroup label="Modes" options={masters.tutorModes.map(m => ({ value: m, label: MODE_LABELS[m] }))} value={f.modes} onChange={v => setF({ ...f, modes: v })} error={errors.modes} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Fee from (₹ / month)" type="number" min={0} value={f.feeMin} onChange={e => setF({ ...f, feeMin: e.target.value })} />
            <TextInput label="Fee up to (₹ / month)" type="number" min={0} value={f.feeMax} onChange={e => setF({ ...f, feeMax: e.target.value })} error={errors.feeMax} />
          </div>
          <TextArea label="About you" rows={4} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} error={errors.bio} hint="Parents see this once you accept a lead" />
        </div>
      </Card>
      <div className="flex justify-end"><button type="button" className={btn.primary} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    </div>
  )
}
