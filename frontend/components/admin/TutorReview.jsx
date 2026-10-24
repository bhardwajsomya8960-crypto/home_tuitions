'use client'

import { useCallback, useEffect, useState } from 'react'
import { FiEye } from 'react-icons/fi'
import Modal from '../ui/Modal'
import { StatusBadge } from '../ui/Badge'
import { btn, Details, PageLoader } from '../ui/Card'
import { Notice, TextInput } from '../ui/Form'
import { api, openProtectedFile } from '../../lib/api'
import { classLabel, DOC_STATUS, formatDate, MODE_LABELS, rupees, scheduleText, TUTOR_STATUS } from '../../lib/format'

const ACTION_LABELS = { start_review: 'Start review', verify: 'Verify', activate: 'Activate', suspend: 'Suspend', reject: 'Reject' }
const NEEDS_NOTE = ['suspend', 'reject']

// Tutor verification (blueprint §10.8): review each KYC document, then verify and activate.
export default function TutorReview({ tutorId, masters, onClose, onChanged }) {
  const [tutor, setTutor] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState('')
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')

  const load = useCallback(() => api(`/api/admin/tutors/${tutorId}`, { role: 'admin' }).then(setTutor).catch(e => setError(e.message)), [tutorId])
  useEffect(() => { if (tutorId) { setTutor(null); setError(''); setNotice(''); load() } }, [tutorId, load])

  const act = async (path, body, success) => {
    setBusy(true); setError(''); setNotice('')
    try {
      await api(path, { method: 'POST', body, role: 'admin' })
      await load()
      setNotice(success)
      onChanged?.()
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const latestByType = type => tutor.documents.find(d => d.type === type)

  return (
    <Modal open={!!tutorId} title={tutor ? tutor.name : 'Tutor'} onClose={onClose} wide>
      {!tutor ? (error ? <Notice>{error}</Notice> : <PageLoader />) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2"><StatusBadge map={TUTOR_STATUS} value={tutor.status} /><span className="text-xs text-gray-500">Registered {formatDate(tutor.createdAt)}</span></div>
          <Notice>{error}</Notice>
          <Notice tone="success">{notice}</Notice>

          <Details items={[
            ['Phone', `+91 ${tutor.phone}`], ['Email', tutor.email], ['Gender', tutor.gender], ['Date of birth', tutor.dob && formatDate(tutor.dob)],
            ['Qualification', `${tutor.qualification}${tutor.college ? `, ${tutor.college}` : ''}`], ['Experience', `${tutor.experienceYears} years`],
            ['Subjects', tutor.subjects.join(', ')], ['Classes', tutor.classes.map(classLabel).join(', ')], ['Boards', tutor.boards.join(', ')],
            ['Languages', tutor.languages.join(', ')], ['Modes', tutor.modes.map(m => MODE_LABELS[m]).join(', ')], ['Travel radius', `${tutor.serviceRadiusKm} km`],
            ['Address', `${tutor.address}, ${tutor.pincode}`], ['Location', tutor.latitude != null ? `${tutor.latitude.toFixed(4)}, ${tutor.longitude.toFixed(4)}` : 'Pincode only'],
            ['Fees', tutor.feeMin || tutor.feeMax ? `${rupees(tutor.feeMin)} – ${rupees(tutor.feeMax)} / month` : ''], ['Availability', scheduleText(tutor.availability)],
            ['Offers', `${tutor.offerStats.total} received · ${tutor.offerStats.accepted} accepted · ${tutor.offerStats.declined} declined · ${tutor.offerStats.expired} expired`],
            ['Rating', tutor.ratingCount ? `${tutor.ratingAvg.toFixed(1)} from ${tutor.ratingCount}` : 'No reviews'],
          ]} />
          <div><p className="text-xs text-gray-500">Bio</p><p className="text-sm">{tutor.bio}</p></div>

          <section>
            <h3 className="text-base mb-2 font-semibold">KYC documents</h3>
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {masters.documentTypes.map(t => {
                const doc = latestByType(t.value)
                return (
                  <li key={t.value} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm">
                    <div>
                      <p className="font-medium">{t.label}{t.required && <span className="text-red-600"> *</span>}</p>
                      {doc ? <p className="text-xs text-gray-500">{doc.originalName} · {Math.max(1, Math.round(doc.sizeBytes / 1024))} KB · {formatDate(doc.createdAt)}{doc.rejectReason ? ` · rejected: ${doc.rejectReason}` : ''}</p> : <p className="text-xs text-gray-500">Not uploaded</p>}
                    </div>
                    {doc && (
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge map={DOC_STATUS} value={doc.status} />
                        <button type="button" className={btn.secondary} onClick={() => openProtectedFile(`/api/admin/documents/${doc.id}/file`, 'admin').catch(e => setError(e.message))}><FiEye aria-hidden="true" /> View</button>
                        {doc.status !== 'accepted' && <button type="button" className={btn.success} disabled={busy} onClick={() => act(`/api/admin/documents/${doc.id}/review`, { status: 'accepted' }, `${t.label} accepted.`)}>Accept</button>}
                        {doc.status !== 'rejected' && <button type="button" className={btn.danger} disabled={busy} onClick={() => { setRejecting(doc); setReason('') }}>Reject</button>}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold">Account actions</h3>
            {!tutor.requiredDocumentsAccepted && <p className="text-sm text-amber-800">Accept the photo, identity and qualification documents before verifying.</p>}
            {tutor.statusNotes && <p className="text-sm text-gray-600">Last note: {tutor.statusNotes}</p>}
            <TextInput label="Note" hint="Required to suspend or reject; shown to the tutor" value={notes} onChange={e => setNotes(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {tutor.allowedActions.map(a => (
                <button key={a} type="button" disabled={busy || (NEEDS_NOTE.includes(a) && !notes.trim()) || (a === 'verify' && !tutor.requiredDocumentsAccepted)}
                  className={NEEDS_NOTE.includes(a) ? btn.danger : a === 'activate' ? btn.success : btn.primary}
                  onClick={() => act(`/api/admin/tutors/${tutor.id}/actions`, { action: a, ...(notes.trim() ? { notes: notes.trim() } : {}) }, `${ACTION_LABELS[a]}: done.`).then(ok => ok && setNotes(''))}>
                  {ACTION_LABELS[a]}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
      <Modal open={!!rejecting} title="Reject document" onClose={() => setRejecting(null)}
        footer={<><button type="button" className={btn.secondary} onClick={() => setRejecting(null)}>Cancel</button>
          <button type="button" className={btn.primary} disabled={busy || reason.trim().length < 3} onClick={() => act(`/api/admin/documents/${rejecting.id}/review`, { status: 'rejected', reason: reason.trim() }, 'Document rejected. The tutor can upload a new one.').then(ok => ok && setRejecting(null))}>Reject</button></>}>
        <TextInput label="Reason shown to the tutor" required value={reason} onChange={e => setReason(e.target.value)} placeholder="For example: image is blurred" />
      </Modal>
    </Modal>
  )
}
