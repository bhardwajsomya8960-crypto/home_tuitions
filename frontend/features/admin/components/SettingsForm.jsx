'use client'

import { useEffect, useState } from 'react'
import { btn, Card } from '@/shared/ui/Card'
import { Checkbox, Notice, TextInput } from '@/shared/ui/Form'

const WEIGHTS = [
  ['distance', 'Distance'], ['subjectFit', 'Subject / class / board fit'], ['availability', 'Availability'],
  ['experience', 'Experience'], ['quality', 'Quality / rating'], ['acceptanceReliability', 'Acceptance reliability'], ['feeFit', 'Fee fit'],
]

// Matching configuration (blueprint §17, Appendix C). The server validates again on save.
export default function SettingsForm({ settings, defaults, busy, onSave }) {
  const [s, setS] = useState(settings)
  useEffect(() => setS(settings), [settings])
  const total = WEIGHTS.reduce((sum, [k]) => sum + (Number(s.weights[k]) || 0), 0)
  const setWeight = (k, v) => setS({ ...s, weights: { ...s.weights, [k]: v === '' ? '' : Math.max(0, Math.min(100, parseInt(v, 10) || 0)) } })
  const setBand = (i, key, v) => setS({ ...s, distanceBands: s.distanceBands.map((b, j) => (j === i ? { ...b, [key]: v === '' ? '' : Number(v) } : b)) })
  const num = (k, v) => setS({ ...s, [k]: v === '' ? '' : Number(v) })

  const save = () => onSave({
    weights: Object.fromEntries(WEIGHTS.map(([k]) => [k, Number(s.weights[k]) || 0])),
    distanceBands: s.distanceBands.map(b => ({ maxKm: Number(b.maxKm), score: Math.round(Number(b.score)) })),
    defaultHomeRadiusKm: Number(s.defaultHomeRadiusKm), maxExtendedRadiusKm: Number(s.maxExtendedRadiusKm),
    offerTimeoutMinutes: Math.round(Number(s.offerTimeoutMinutes)), maxSimultaneousOffers: Math.round(Number(s.maxSimultaneousOffers)),
    autoConfirmAssignments: !!s.autoConfirmAssignments, demoDurationMinutes: Math.round(Number(s.demoDurationMinutes)),
    noShowEscalationThreshold: Math.round(Number(s.noShowEscalationThreshold)),
  })

  return (
    <div className="space-y-4">
      <Card title="Score weights" subtitle="How much each factor counts when ranking tutors. Must add up to 100%.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WEIGHTS.map(([k, label]) => (
            <TextInput key={k} label={`${label} (%)`} type="number" min={0} max={100} value={s.weights[k]} onChange={e => setWeight(k, e.target.value)} />
          ))}
        </div>
        <p className={`mt-3 text-sm font-semibold ${total === 100 ? 'text-green-700' : 'text-red-700'}`} aria-live="polite">Total: {total}%{total !== 100 && ' (must be 100%)'}</p>
      </Card>

      <Card title="Distance" subtitle="Home tuition only. Tutors are never offered leads beyond their own travel radius or the maximum below.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Default travel radius for new tutors (km)" type="number" min={1} value={s.defaultHomeRadiusKm} onChange={e => num('defaultHomeRadiusKm', e.target.value)} />
          <TextInput label="Maximum radius (km)" type="number" min={1} value={s.maxExtendedRadiusKm} onChange={e => num('maxExtendedRadiusKm', e.target.value)} />
        </div>
        <h3 className="mb-2 mt-5 text-sm font-semibold">Distance bands</h3>
        <div className="space-y-2">
          {s.distanceBands.map((b, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <TextInput className="w-40" label={`Up to (km)`} type="number" min={0} step="0.5" value={b.maxKm} onChange={e => setBand(i, 'maxKm', e.target.value)} />
              <TextInput className="w-40" label="Score (0–100)" type="number" min={0} max={100} value={b.score} onChange={e => setBand(i, 'score', e.target.value)} />
              {s.distanceBands.length > 1 && <button type="button" className={btn.danger} onClick={() => setS({ ...s, distanceBands: s.distanceBands.filter((_, j) => j !== i) })}>Remove</button>}
            </div>
          ))}
          {s.distanceBands.length < 8 && <button type="button" className={btn.secondary} onClick={() => setS({ ...s, distanceBands: [...s.distanceBands, { maxKm: (s.distanceBands.at(-1)?.maxKm || 0) + 2, score: 0 }] })}>Add band</button>}
        </div>
      </Card>

      <Card title="Offers and demos">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TextInput label="Offer timeout (minutes)" type="number" min={1} value={s.offerTimeoutMinutes} onChange={e => num('offerTimeoutMinutes', e.target.value)} />
          <TextInput label="Tutors offered at once" type="number" min={1} max={10} value={s.maxSimultaneousOffers} onChange={e => num('maxSimultaneousOffers', e.target.value)} hint="1 = one tutor at a time" />
          <TextInput label="Demo length (minutes)" type="number" min={15} value={s.demoDurationMinutes} onChange={e => num('demoDurationMinutes', e.target.value)} />
          <TextInput label="Escalate after missed demos" type="number" min={1} value={s.noShowEscalationThreshold} onChange={e => num('noShowEscalationThreshold', e.target.value)} />
        </div>
        <div className="mt-4">
          <Checkbox checked={s.autoConfirmAssignments} onChange={v => setS({ ...s, autoConfirmAssignments: v })} label="Confirm automatically when a tutor accepts (skips operations approval and shares contact details straight away)" />
        </div>
      </Card>

      {total !== 100 && <Notice tone="warning">Weights must add up to 100% before you can save.</Notice>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className={btn.secondary} onClick={() => setS(defaults)}>Reset to defaults</button>
        <button type="button" className={btn.primary} disabled={busy || total !== 100} onClick={save}>{busy ? 'Saving…' : 'Save settings'}</button>
      </div>
    </div>
  )
}
