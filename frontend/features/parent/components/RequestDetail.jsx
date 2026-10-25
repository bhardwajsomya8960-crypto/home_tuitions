'use client'

import { useState } from 'react'
import { FiStar } from 'react-icons/fi'
import Modal from '@/shared/ui/Modal'
import SimpleTable from '@/shared/ui/SimpleTable'
import { StatusBadge } from '@/shared/ui/Badge'
import { btn, Details } from '@/shared/ui/Card'
import { TextArea } from '@/shared/ui/Form'
import { api } from '@/shared/lib/api'
import { optionLabel } from '@/shared/lib/useMasters'
import { classLabel, daysText, DEMO_STATUS, formatDate, formatDateTime, LEAD_STATUS, MODE_LABELS, rupees, scheduleText, slotsText } from '@/shared/lib/format'
import { PARENT_API } from '@/features/parent/api/endpoints'

export function RequestDetail({ request: r, masters, busy, act }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reschedule, setReschedule] = useState(null)
  const [rescheduleText, setRescheduleText] = useState('')
  const completedDemo = r.demos.find(d => d.status === 'completed')
  const scheduledDemo = r.demos.find(d => d.status === 'scheduled')
  const stage = r.enrolment ? 'ongoing' : 'demo'
  const canRate = completedDemo && !r.reviewedStages.includes(stage)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-sage"><StatusBadge map={LEAD_STATUS} value={r.status} /> {r.subjects.join(', ')} · {classLabel(r.class)} {r.board} · {MODE_LABELS[r.mode]}</div>
      <div className="space-y-5">
          <Details items={[
            ['Days', daysText(r.preferredDays)], ['Times', slotsText(r.preferredSlots)],
            ['Budget', masters ? optionLabel(masters.budgetRanges, r.budgetRange) : r.budgetRange], ['Start', r.startDate ? formatDate(r.startDate) : ''],
            ['Location', r.mode === 'online' ? 'Online' : `${r.address || ''}${r.pincode ? `, ${r.pincode}` : ''}`],
          ]} />

          {r.tutor && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">{r.tutor.confirmed ? 'Your tutor' : 'Tutor available (awaiting our confirmation)'}</h3>
              <Details items={[
                ['Name', r.tutor.name],
                ['Qualification', r.tutor.qualification],
                ['Experience', `${r.tutor.experienceYears} years`],
                ['Languages', r.tutor.languages.join(', ')],
                ['Rating', r.tutor.ratingCount > 0 ? <span key="r" className="inline-flex items-center gap-1"><FiStar className="h-4 w-4 fill-current text-yellow-500" aria-hidden="true" /> {r.tutor.ratingAvg.toFixed(1)} ({r.tutor.ratingCount})</span> : 'No reviews yet'],
                ['About', r.tutor.bio],
                ['Contact', r.tutor.phone ? <a key="c" className="underline" href={`tel:+91${r.tutor.phone}`}>+91 {r.tutor.phone}</a> : 'Shared after confirmation'],
              ]} />
            </div>
          )}

          {r.demos.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Demo</h3>
              <SimpleTable flush={false} rows={r.demos} minWidth={560} columns={[
                { key: 'when', header: 'When', render: d => <span className="whitespace-nowrap">{formatDateTime(d.scheduledAt)}</span> },
                { key: 'mode', header: 'Mode', render: d => MODE_LABELS[d.mode] },
                { key: 'len', header: 'Length', render: d => `${d.durationMin} min` },
                { key: 'where', header: 'Place / link', render: d => d.locationNote || '—' },
                { key: 'status', header: 'Status', render: d => <StatusBadge map={DEMO_STATUS} value={d.status} /> },
              ]} />
              {scheduledDemo && <button type="button" className={`${btn.link} mt-2`} onClick={() => setReschedule(scheduledDemo.id)}>Ask to reschedule</button>}
            </div>
          )}

          {r.status === 'demo_completed' && completedDemo && !completedDemo.outcome && masters && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold">How did the demo go?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {masters.demoOutcomes.map(o => (
                  <button key={o.value} type="button" disabled={busy} className={o.value === 'interested' ? btn.success : btn.secondary}
                    onClick={() => act(PARENT_API.demoAction(completedDemo.id, 'outcome'), { outcome: o.value }, 'Thank you. Our team will follow up.')}>{o.label}</button>
                ))}
              </div>
            </div>
          )}

          {r.enrolment && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Tuition</h3>
              <Details items={[
                ['Status', r.enrolment.status], ['Fee', `${rupees(r.enrolment.feeAmount)} · ${r.enrolment.plan.replace('_', ' ')}`],
                ['Started', formatDate(r.enrolment.startDate)], ['Schedule', scheduleText(r.enrolment.schedule)],
              ]} />
            </div>
          )}

          {canRate && (
            <div className="rounded-lg border border-sand-200 p-4">
              <p className="font-semibold">Rate {r.tutor?.name || 'the tutor'} {stage === 'demo' ? 'after the demo' : 'so far'}</p>
              <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-yellow-50">
                    <FiStar className={`h-6 w-6 ${n <= rating ? 'fill-current text-yellow-500' : 'text-sand-300'}`} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <TextArea label="Comment" hint="Optional" rows={2} value={comment} onChange={e => setComment(e.target.value)} className="mt-2" />
              <button type="button" disabled={!rating || busy} className={`${btn.primary} mt-3`} onClick={() => act(PARENT_API.requestAction(r.id, 'review'), { rating, ...(comment ? { comment } : {}) }, 'Thanks for your feedback.')}>Submit rating</button>
            </div>
          )}

          {r.canCancel && (
            <button type="button" disabled={busy} className={btn.danger} onClick={() => { if (window.confirm('Cancel this request? Tutors will stop receiving it.')) act(PARENT_API.requestAction(r.id, 'cancel'), {}, 'Request cancelled.') }}>Cancel request</button>
          )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Progress</h3>
        <SimpleTable flush={false} rows={[...r.timeline].reverse().map((t, i) => ({ ...t, id: i }))} minWidth={420} columns={[
          { key: 'at', header: 'When', render: t => <span className="whitespace-nowrap">{formatDateTime(t.at)}</span> },
          { key: 'text', header: 'Update', render: t => t.text },
        ]} />
      </div>

      <Modal open={!!reschedule} title="Ask to reschedule the demo" onClose={() => setReschedule(null)}
        footer={<><button type="button" className={btn.secondary} onClick={() => setReschedule(null)}>Close</button>
          <button type="button" className={btn.primary} disabled={busy || rescheduleText.trim().length < 3}
            onClick={() => act(PARENT_API.demoAction(reschedule, 'reschedule-request'), { message: rescheduleText }, 'Request sent. Our team will confirm a new time.').then(ok => { if (ok !== false) { setReschedule(null); setRescheduleText('') } })}>Send</button></>}>
        <TextArea label="When would suit you?" required rows={3} value={rescheduleText} onChange={e => setRescheduleText(e.target.value)} hint="For example: Saturday after 11 AM" />
      </Modal>
    </div>
  )
}
