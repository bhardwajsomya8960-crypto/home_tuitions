'use client'

import { useCallback, useEffect, useState } from 'react'
import { FiPlay, FiSend, FiCheck } from 'react-icons/fi'
import Modal from '../ui/Modal'
import SimpleTable from '../ui/SimpleTable'
import SlotGrid from '../ui/SlotGrid'
import { StatusBadge } from '../ui/Badge'
import { btn, Details, PageLoader } from '../ui/Card'
import { ChipGroup, Notice, Select, TextArea, TextInput } from '../ui/Form'
import { api } from '../../lib/api'
import { optionLabel } from '../../lib/useMasters'
import {
  classLabel, daysText, DEMO_STATUS, formatDate, formatDateTime, istLocalToIso, LEAD_STATUS, MODE_LABELS,
  OFFER_STATUS, rupees, slotsText,
} from '../../lib/format'
import Countdown from '../ui/Countdown'

const FACTOR_LABELS = { distance: 'Distance', subjectFit: 'Subject fit', availability: 'Availability', experience: 'Experience', quality: 'Quality', acceptanceReliability: 'Reliability', feeFit: 'Fee fit' }

// Everything staff do with one lead: qualify, match, offer, confirm, demo, convert (blueprint §10.5).
export default function LeadWorkspace({ leadId, masters, onClose, onChanged }) {
  const [lead, setLead] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => api(`/api/admin/leads/${leadId}`, { role: 'admin' }).then(setLead).catch(e => setError(e.message)), [leadId])
  useEffect(() => { if (leadId) { setLead(null); setError(''); setNotice(''); load() } }, [leadId, load])

  // Runs an admin action; the API returns the updated lead.
  const act = async (path, body, success, method = 'POST') => {
    setBusy(true); setError(''); setNotice('')
    try {
      const updated = await api(path, { method, body, role: 'admin' })
      if (updated?.id === leadId) setLead(updated); else await load()
      setNotice(success)
      onChanged?.()
      return true
    } catch (err) {
      setError(err.message + (err.details?.length ? `: ${err.details.map(d => d.message).join('; ')}` : ''))
      return false
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={!!leadId} title={lead ? `${lead.code} · ${lead.student?.name}` : 'Lead'} onClose={onClose} wide>
      {!lead ? (error ? <Notice>{error}</Notice> : <PageLoader />) : (
        <div className="space-y-6">
          <div className="sticky -top-4 z-10 -mx-5 -mt-4 space-y-2 border-b border-gray-100 bg-white px-5 pb-3 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge map={LEAD_STATUS} value={lead.status} />
              {lead.noTutorFound && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">No tutor found</span>}
              <span className="text-xs text-gray-500">Source: {lead.source} · Created {formatDateTime(lead.createdAt)}</span>
            </div>
            <Notice>{error}</Notice>
            <Notice tone="success">{notice}</Notice>
          </div>

          <section>
            <h3 className="text-base mb-2 font-semibold">Requirement</h3>
            <Details items={[
              ['Parent', `${lead.parent.name} (${lead.parent.relationship})`], ['Phone', <a key="p" className="underline" href={`tel:+91${lead.parent.phone}`}>+91 {lead.parent.phone}</a>],
              ['Student', `${lead.student.name} · ${classLabel(lead.class)} ${lead.board}`], ['Subjects', lead.subjects.join(', ')],
              ['Mode', MODE_LABELS[lead.mode]], ['Days / times', `${daysText(lead.preferredDays)} · ${slotsText(lead.preferredSlots)}`],
              ['Budget', optionLabel(masters.budgetRanges, lead.budgetRange)], ['Urgency', optionLabel(masters.urgency, lead.urgency)],
              ['Address', lead.address ? `${lead.address}, ${lead.pincode}` : (lead.mode === 'online' ? 'Online' : '')],
              ['Location', lead.latitude != null ? `${lead.latitude.toFixed(4)}, ${lead.longitude.toFixed(4)} (${lead.geocodeSource})` : lead.mode === 'online' ? 'Not needed' : 'Pincode only'],
              lead.prefGender ? ['Tutor gender', lead.prefGender] : null, lead.prefLanguages.length ? ['Languages', lead.prefLanguages.join(', ')] : null,
              lead.specialRequirements ? ['Notes', lead.specialRequirements] : null, lead.courseSlug ? ['Course', lead.courseSlug] : null,
            ]} />
            {lead.mode !== 'online' && lead.latitude == null && <LocationForm busy={busy} onSave={body => act(`/api/admin/leads/${lead.id}/location`, body, 'Location saved.', 'PATCH')} />}
          </section>

          <StatusForm lead={lead} masters={masters} busy={busy} onSubmit={body => act(`/api/admin/leads/${lead.id}/status`, body, 'Status updated.')} />

          <MatchingSection lead={lead} busy={busy}
            onRun={() => act(`/api/admin/leads/${lead.id}/match`, undefined, 'Matching complete.')}
            onOfferNext={() => act(`/api/admin/leads/${lead.id}/offers`, {}, 'Offer sent.')}
            onOffer={tutorId => act(`/api/admin/leads/${lead.id}/offers`, { tutorIds: [tutorId] }, 'Offer sent.')}
            onConfirm={id => act(`/api/admin/assignments/${id}/confirm`, undefined, 'Tutor confirmed. Contact details shared.')}
            onRelease={id => act(`/api/admin/assignments/${id}/release`, { note: 'Released by operations' }, 'Tutor released.')}
            onExpire={load} />

          <DemoSection lead={lead} masters={masters} busy={busy} act={act} />

          {lead.status === 'demo_completed' && <ConvertForm lead={lead} masters={masters} busy={busy} onSubmit={body => act(`/api/admin/leads/${lead.id}/convert`, body, 'Converted. Enrolment, first invoice and classes created.')} />}
          {lead.enrolment && (
            <section className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
              <p className="font-semibold text-green-900">Enrolment {lead.enrolment.status}</p>
              <p>{rupees(lead.enrolment.feeAmount)} · {lead.enrolment.plan} · from {formatDate(lead.enrolment.startDate)}</p>
            </section>
          )}

          <History lead={lead} busy={busy} onNote={note => act(`/api/admin/leads/${lead.id}/notes`, { note }, 'Note added.')} />
        </div>
      )}
    </Modal>
  )
}

function LocationForm({ busy, onSave }) {
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm text-amber-900">No map location. Matching uses tutors in the same pincode only. Add coordinates from a map to match by distance.</p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <TextInput label="Latitude" className="w-36" inputMode="decimal" value={lat} onChange={e => setLat(e.target.value)} />
        <TextInput label="Longitude" className="w-36" inputMode="decimal" value={lng} onChange={e => setLng(e.target.value)} />
        <button type="button" className={btn.secondary} disabled={busy || !lat || !lng} onClick={() => onSave({ latitude: Number(lat), longitude: Number(lng) })}>Save location</button>
      </div>
    </div>
  )
}

function StatusForm({ lead, masters, busy, onSubmit }) {
  const [to, setTo] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  useEffect(() => { setTo(''); setReason(''); setNote('') }, [lead.status])
  if (!lead.allowedTransitions.length) return null
  return (
    <section>
      <h3 className="text-base mb-2 font-semibold">Change status</h3>
      <div className="flex flex-wrap items-end gap-2">
        <Select label="Move to" className="w-48" value={to} onChange={e => setTo(e.target.value)} options={lead.allowedTransitions.map(s => ({ value: s, label: LEAD_STATUS[s].label }))} />
        {to === 'lost' && <Select label="Reason" className="w-52" value={reason} onChange={e => setReason(e.target.value)} options={masters.lostReasons} />}
        <TextInput label="Note" className="min-w-[200px] flex-1" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional" />
        <button type="button" className={btn.primary} disabled={busy || !to || (to === 'lost' && !reason)} onClick={() => onSubmit({ status: to, ...(reason ? { reason } : {}), ...(note ? { note } : {}) })}>Update</button>
      </div>
    </section>
  )
}

function MatchingSection({ lead, busy, onRun, onOfferNext, onOffer, onConfirm, onRelease, onExpire }) {
  const canMatch = ['new', 'contacted', 'qualified', 'matching', 'tutor_offered', 'demo_completed'].includes(lead.status)
  const canOffer = ['matching', 'tutor_offered'].includes(lead.status) && lead.latestMatch
  const offeredIds = new Set(lead.assignments.map(a => a.tutorId))
  const results = lead.latestMatch?.results || []
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">Tutor matching</h3>
        <div className="flex flex-wrap gap-2">
          {canMatch && <button type="button" className={btn.secondary} disabled={busy} onClick={onRun}><FiPlay aria-hidden="true" /> {lead.latestMatch ? 'Re-run matching' : 'Run matching'}</button>}
          {canOffer && <button type="button" className={btn.primary} disabled={busy} onClick={onOfferNext}><FiSend aria-hidden="true" /> Offer to next tutor</button>}
        </div>
      </div>
      {lead.latestMatch && (
        <p className="text-xs text-gray-500">Last run {formatDateTime(lead.latestMatch.createdAt)} · {results.length} eligible · {lead.latestMatch.excludedCount} excluded by filters · weights {Object.entries(lead.latestMatch.settings.weights).map(([k, v]) => `${FACTOR_LABELS[k]} ${v}%`).join(', ')}</p>
      )}
      {results.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Tutor</th><th className="px-3 py-2 text-right">Score</th><th className="px-3 py-2">Distance</th><th className="px-3 py-2">Breakdown</th><th className="px-3 py-2" /></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map(r => (
                <tr key={r.tutorId} className="align-top">
                  <td className="px-3 py-2 font-medium">{r.rank}</td>
                  <td className="px-3 py-2"><p className="font-medium">{r.tutorName}</p><ul className="mt-1 text-xs text-gray-500">{r.reasons.map(x => <li key={x}>{x}</li>)}</ul></td>
                  <td className="px-3 py-2 text-right text-lg font-bold">{r.score}</td>
                  <td className="px-3 py-2">{r.distanceKm != null ? `${r.distanceKm} km${r.distanceEstimated ? ' (est.)' : ''}` : 'Online'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{Object.entries(r.factors).map(([k, v]) => <span key={k} className="mr-2 inline-block">{FACTOR_LABELS[k]} {v}</span>)}</td>
                  <td className="px-3 py-2 text-right">{canOffer && !offeredIds.has(r.tutorId) ? <button type="button" className={btn.link} disabled={busy} onClick={() => onOffer(r.tutorId)}>Offer</button> : offeredIds.has(r.tutorId) ? <span className="text-xs text-gray-500">Offered</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {lead.latestMatch && results.length === 0 && <Notice tone="warning">No tutor meets the requirement. Consider switching to online, widening the time slots, or recruiting tutors in this area.</Notice>}

      {lead.assignments.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">Offers ({lead.assignments.length})</h4>
          <SimpleTable flush={false} rows={lead.assignments} minWidth={760} columns={[
            { key: 'tutor', header: 'Tutor', render: a => <span className="font-medium">{a.tutorName}</span> },
            { key: 'score', header: 'Score', align: 'right', render: a => a.score },
            { key: 'offered', header: 'Offered', render: a => <span className="whitespace-nowrap text-xs">{formatDateTime(a.offeredAt)}</span> },
            { key: 'response', header: 'Response', render: a => <span className="text-xs">{[a.rejectReason && `${a.rejectReason.replace(/_/g, ' ')}${a.rejectComment ? `: ${a.rejectComment}` : ''}`, a.infoRequest && `Asks: “${a.infoRequest}”`].filter(Boolean).join(' · ') || '—'}</span> },
            { key: 'status', header: 'Status', render: a => <span className="flex flex-col items-start gap-1"><StatusBadge map={OFFER_STATUS} value={a.status} />{a.status === 'offered' && <Countdown expiresAt={a.expiresAt} onExpire={onExpire} />}</span> },
            { key: 'act', header: '', align: 'right', sticky: true, render: a => (
              <span className="inline-flex gap-2">
                {a.status === 'accepted' && <button type="button" className={btn.success} disabled={busy} onClick={() => onConfirm(a.id)}><FiCheck aria-hidden="true" /> Confirm</button>}
                {['accepted', 'confirmed'].includes(a.status) && lead.status !== 'converted' && <button type="button" className={btn.danger} disabled={busy} onClick={() => { if (window.confirm('Release this tutor and look for another?')) onRelease(a.id) }}>Release</button>}
              </span>
            ) },
          ]} />
        </div>
      )}
    </section>
  )
}

function DemoSection({ lead, masters, busy, act }) {
  const [when, setWhen] = useState('')
  const [mode, setMode] = useState(lead.mode === 'online' ? 'online' : 'home')
  const [note, setNote] = useState('')
  const [complete, setComplete] = useState(null)
  const [outcome, setOutcome] = useState('')
  const [notes, setNotes] = useState('')
  const [moveTo, setMoveTo] = useState({})
  const minLocal = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 16)
  const rescheduleAsks = lead.events.filter(e => e.type === 'reschedule_requested')

  if (!['tutor_accepted', 'demo_scheduled', 'demo_completed', 'converted'].includes(lead.status) && lead.demos.length === 0) return null
  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold">Demo</h3>
      {rescheduleAsks.length > 0 && lead.status === 'demo_scheduled' && <Notice tone="warning">Parent asked to reschedule: “{rescheduleAsks.at(-1).note}”</Notice>}
      {lead.demos.length > 0 && (
        <SimpleTable flush={false} rows={lead.demos} minWidth={900} columns={[
          { key: 'when', header: 'When', render: d => <span className="whitespace-nowrap font-medium">{formatDateTime(d.scheduledAt)}</span> },
          { key: 'tutor', header: 'Tutor', render: d => d.tutorName },
          { key: 'mode', header: 'Mode', render: d => `${MODE_LABELS[d.mode]} · ${d.durationMin} min` },
          { key: 'where', header: 'Place / link', render: d => <span className="text-xs">{d.locationNote || '—'}</span> },
          { key: 'outcome', header: 'Outcome', render: d => (d.outcome ? optionLabel(masters.demoOutcomes, d.outcome) : '—') },
          { key: 'status', header: 'Status', render: d => <StatusBadge map={DEMO_STATUS} value={d.status} /> },
          { key: 'act', header: 'Actions', sticky: true, render: d => (
            <>
              {d.status === 'scheduled' && (
                <div className="flex min-w-[260px] flex-col gap-1.5">
                  <span className="flex flex-wrap gap-1.5">
                    <button type="button" className={btn.success} disabled={busy} onClick={() => { setComplete(d.id); setOutcome(''); setNotes('') }}>Completed</button>
                    <button type="button" className={btn.danger} disabled={busy} onClick={() => act(`/api/admin/demos/${d.id}/cancel`, {}, 'Demo cancelled.')}>Cancel</button>
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    <button type="button" className={btn.secondary} disabled={busy} onClick={() => act(`/api/admin/demos/${d.id}/no-show`, { party: 'parent' }, 'Recorded parent no-show.')}>Parent no-show</button>
                    <button type="button" className={btn.secondary} disabled={busy} onClick={() => act(`/api/admin/demos/${d.id}/no-show`, { party: 'tutor' }, 'Recorded tutor no-show.')}>Tutor no-show</button>
                  </span>
                  <span className="flex gap-1.5">
                    <input type="datetime-local" aria-label="New time" min={minLocal} value={moveTo[d.id] || ''} onChange={e => setMoveTo({ ...moveTo, [d.id]: e.target.value })} className="min-h-[40px] flex-1 rounded-lg border border-gray-300 px-2 text-sm" />
                    <button type="button" className={btn.secondary} disabled={busy || !moveTo[d.id]} onClick={() => act(`/api/admin/demos/${d.id}/reschedule`, { scheduledAt: istLocalToIso(moveTo[d.id]) }, 'Demo moved.')}>Move</button>
                  </span>
                </div>
              )}
              {d.status === 'completed' && !d.outcome && lead.status === 'demo_completed' && (
                <div className="flex min-w-[200px] flex-col gap-1.5">
                  {masters.demoOutcomes.map(o => <button key={o.value} type="button" className={btn.secondary} disabled={busy} onClick={() => act(`/api/admin/demos/${d.id}/outcome`, { outcome: o.value }, 'Outcome recorded.')}>{o.label}</button>)}
                </div>
              )}
            </>
          ) },
        ]} />
      )}
      {lead.status === 'tutor_accepted' && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg bg-gray-50 p-3">
          <label className="text-sm font-medium">When (IST)
            <input type="datetime-local" min={minLocal} value={when} onChange={e => setWhen(e.target.value)} className="mt-1 block min-h-[44px] rounded-lg border border-gray-300 px-2" />
          </label>
          <Select label="Mode" className="w-32" value={mode} onChange={e => setMode(e.target.value)} options={(lead.mode === 'online' ? ['online'] : ['home', 'online']).map(m => ({ value: m, label: MODE_LABELS[m] }))} placeholder="Mode" />
          <TextInput label="Note / link" className="min-w-[180px] flex-1" value={note} onChange={e => setNote(e.target.value)} placeholder="Meeting link or landmark" />
          <button type="button" className={btn.primary} disabled={busy || !when} onClick={() => act(`/api/admin/leads/${lead.id}/demos`, { scheduledAt: istLocalToIso(when), mode, ...(note ? { locationNote: note } : {}) }, 'Demo scheduled. Tutor confirmed.')}>Schedule demo</button>
        </div>
      )}
      <Modal open={!!complete} title="Demo completed" onClose={() => setComplete(null)}
        footer={<><button type="button" className={btn.secondary} onClick={() => setComplete(null)}>Cancel</button>
          <button type="button" className={btn.primary} disabled={busy} onClick={() => act(`/api/admin/demos/${complete}/complete`, { ...(outcome ? { outcome } : {}), ...(notes ? { notes } : {}) }, 'Demo marked completed.').then(ok => ok && setComplete(null))}>Save</button></>}>
        <div className="space-y-4">
          <ChipGroup label="Outcome" hint="Leave empty to let the parent choose" single options={masters.demoOutcomes} value={outcome} onChange={setOutcome} />
          <TextArea label="Notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </Modal>
    </section>
  )
}

function ConvertForm({ lead, masters, busy, onSubmit }) {
  const demo = lead.demos.find(d => d.status === 'completed')
  const [f, setF] = useState({ plan: 'monthly', feeAmount: '', startDate: '', schedule: lead.preferredDays.flatMap(day => lead.preferredSlots.map(slot => ({ day, slot }))) })
  const confirmed = lead.assignments.some(a => a.status === 'confirmed')
  if (!confirmed) return <Notice tone="warning">The tutor was released. Run matching again to find another tutor.</Notice>
  return (
    <section className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/40 p-4">
      <h3 className="text-base font-semibold">Convert to enrolment</h3>
      {demo?.outcome && demo.outcome !== 'interested' && <Notice tone="warning">Demo outcome is “{optionLabel(masters.demoOutcomes, demo.outcome)}”. Convert only if the parent has agreed.</Notice>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Select label="Plan" required value={f.plan} onChange={e => setF({ ...f, plan: e.target.value })} options={masters.plans.map(p => ({ value: p, label: p.replace('_', ' ') }))} />
        <TextInput label="Fee per plan period (₹)" required type="number" min={1} value={f.feeAmount} onChange={e => setF({ ...f, feeAmount: e.target.value })} />
        <TextInput label="Start date" required type="date" value={f.startDate} onChange={e => setF({ ...f, startDate: e.target.value })} />
      </div>
      <SlotGrid label="Class schedule" hint="Pre-filled from the parent's preferred days and times." days={masters.days} slots={masters.slots} value={f.schedule} onChange={v => setF({ ...f, schedule: v })} />
      <button type="button" className={btn.primary} disabled={busy || !f.feeAmount || !f.startDate || !f.schedule.length}
        onClick={() => onSubmit({ plan: f.plan, feeAmount: Number(f.feeAmount), startDate: f.startDate, schedule: f.schedule })}>Convert and create first invoice</button>
    </section>
  )
}

function History({ lead, busy, onNote }) {
  const [note, setNote] = useState('')
  return (
    <section>
      <h3 className="text-base mb-2 font-semibold">History</h3>
      <div className="mb-3 flex gap-2">
        <TextInput className="flex-1" placeholder="Add a call note or follow-up" value={note} onChange={e => setNote(e.target.value)} aria-label="Note" />
        <button type="button" className={btn.secondary} disabled={busy || !note.trim()} onClick={() => onNote(note.trim()).then(ok => ok && setNote(''))}>Add note</button>
      </div>
      <SimpleTable flush={false} rows={[...lead.events].reverse()} minWidth={720} columns={[
        { key: 'when', header: 'When', render: e => <span className="whitespace-nowrap text-xs">{formatDateTime(e.createdAt)}</span> },
        { key: 'event', header: 'Event', render: e => <span className="font-medium">{e.type.replace(/_/g, ' ')}</span> },
        { key: 'change', header: 'Status change', render: e => (e.toStatus && e.fromStatus ? <span className="whitespace-nowrap text-xs">{LEAD_STATUS[e.fromStatus]?.label} → {LEAD_STATUS[e.toStatus]?.label}</span> : '—') },
        { key: 'note', header: 'Note', render: e => <span className="text-xs">{e.note || '—'}</span> },
        { key: 'by', header: 'By', render: e => <span className="text-xs text-gray-500">{e.actor.split(':')[0]}</span> },
      ]} />
    </section>
  )
}
