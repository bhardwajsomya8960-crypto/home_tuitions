'use client'

import { useCallback, useEffect, useState } from 'react'
import { FiMessageCircle, FiPhone } from 'react-icons/fi'
import Modal from '@/shared/ui/Modal'
import SimpleTable from '@/shared/ui/SimpleTable'
import { StatusBadge } from '@/shared/ui/Badge'
import { btn, Details, PageLoader } from '@/shared/ui/Card'
import { Notice, TextArea, TextInput } from '@/shared/ui/Form'
import { api } from '@/shared/lib/api'
import { ENQUIRY_KIND, ENQUIRY_STATUS, formatDateTime } from '@/shared/lib/format'
import { ADMIN_API } from '@/features/admin/api/endpoints'

// One enquiry: who it is, how to reach them, call notes, and turning it into records.
export function EnquiryDetail({ enquiryId, masters, onClose, onChanged, onCreateLead, onCreateParent, onCreateTutor, onOpenParent, onOpenLead, onOpenTutor }) {
  const [e, setE] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [closing, setClosing] = useState(false)
  const [reason, setReason] = useState('')

  const load = useCallback(() => api(ADMIN_API.enquiry(enquiryId), { role: 'admin' }).then(setE).catch(err => setError(err.message)), [enquiryId])
  useEffect(() => { if (enquiryId) { setE(null); setError(''); setNotice(''); setNote(''); load() } }, [enquiryId, load])

  const update = async (body, success) => {
    setBusy(true); setError(''); setNotice('')
    try {
      setE(await api(ADMIN_API.enquiry(enquiryId), { method: 'PATCH', body, role: 'admin' }))
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

  const level = e && masters.enquiryLevels.find(l => l.value === e.level)?.label
  const open = e && ['new', 'contacted'].includes(e.status)

  return (
    <Modal open={!!enquiryId} title={e ? `Enquiry from ${e.name || `+91 ${e.phone}`}` : 'Enquiry'} onClose={onClose} wide>
      {!e ? (error ? <Notice>{error}</Notice> : <PageLoader />) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge map={ENQUIRY_STATUS} value={e.status} />
            <span className="text-xs text-sage">Received {formatDateTime(e.createdAt)} via {e.source}{e.repeatCount > 0 ? ` · sent ${e.repeatCount + 1} times` : ''}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`tel:+91${e.phone}`} className={btn.primary}><FiPhone aria-hidden="true" /> Call +91 {e.phone}</a>
            <a href={`https://wa.me/91${e.phone}`} target="_blank" rel="noopener noreferrer" className={btn.secondary}><FiMessageCircle aria-hidden="true" /> WhatsApp</a>
          </div>
          <Notice>{error}</Notice>
          <Notice tone="success">{notice}</Notice>

          <Details items={[
            ['Type', ENQUIRY_KIND[e.kind]], ['Name', e.name], e.kind === 'parent' && ['I am', e.role && (e.role === 'parent' ? 'A parent' : 'A student')],
            ['Level', level], ['Message', e.message], e.courseSlug && ['Course', e.courseSlug.replace(/-/g, ' ')],
            e.closedReason && ['Closed because', e.closedReason],
          ]} />

          {e.status === 'converted' && (
            <section className="space-y-2">
              <h3 className="text-base font-semibold">Created from this enquiry</h3>
              <div className="flex flex-wrap gap-2">
                {e.leadId && <button type="button" className={btn.secondary} onClick={() => onOpenLead(e.leadId)}>Open tuition request</button>}
                {e.parentId && <button type="button" className={btn.secondary} onClick={() => onOpenParent(e.parentId)}>Open parent</button>}
                {e.tutorId && <button type="button" className={btn.secondary} onClick={() => onOpenTutor(e.tutorId)}>Open tutor</button>}
              </div>
            </section>
          )}

          {open && (
            <section className="space-y-3">
              <h3 className="text-base font-semibold">After the call</h3>
              {e.kind === 'parent' ? (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btn.primary} onClick={() => onCreateLead(e)}>Create parent and tuition request</button>
                  <button type="button" className={btn.secondary} onClick={() => onCreateParent(e)}>Create parent only</button>
                </div>
              ) : (
                <button type="button" className={btn.primary} onClick={() => onCreateTutor(e)}>Create tutor profile</button>
              )}
              <p className="text-xs text-sage">The forms open with this enquiry&apos;s details. Saving links the new record here and marks the enquiry converted.</p>
            </section>
          )}

          <section className="space-y-3">
            <h3 className="text-base font-semibold">Call notes</h3>
            <SimpleTable flush={false} minWidth={480} rows={[...e.notes].reverse().map((n, i) => ({ ...n, id: `${n.at}-${i}` }))} empty="No notes yet." columns={[
              { key: 'at', header: 'When', className: 'whitespace-nowrap text-xs', render: n => formatDateTime(n.at) },
              { key: 'text', header: 'Note', render: n => n.text },
            ]} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <TextArea className="flex-1" label="Add a note" rows={2} maxLength={1000} value={note} onChange={ev => setNote(ev.target.value)} placeholder="What did they say? When to call again?" />
              <button type="button" className={btn.secondary} disabled={busy || !note.trim()} onClick={() => update({ note }, 'Note saved.').then(ok => ok && setNote(''))}>Save note</button>
            </div>
          </section>

          {e.status !== 'converted' && (
            <section className="flex flex-wrap gap-2 border-t border-ink/10 pt-4">
              {e.status === 'new' && <button type="button" className={btn.success} disabled={busy} onClick={() => update({ status: 'contacted' }, 'Marked as contacted.')}>Mark as contacted</button>}
              {open && <button type="button" className={btn.danger} disabled={busy} onClick={() => { setClosing(true); setReason('') }}>Close enquiry</button>}
              {e.status === 'closed' && <button type="button" className={btn.secondary} disabled={busy} onClick={() => update({ status: 'contacted' }, 'Reopened.')}>Reopen</button>}
            </section>
          )}
        </div>
      )}
      <Modal open={closing} title="Close enquiry" onClose={() => setClosing(false)}
        footer={<><button type="button" className={btn.secondary} onClick={() => setClosing(false)}>Cancel</button>
          <button type="button" className={btn.danger} disabled={busy || reason.trim().length < 3} onClick={() => update({ status: 'closed', closedReason: reason.trim() }, 'Enquiry closed.').then(ok => ok && setClosing(false))}>Close enquiry</button></>}>
        <TextInput label="Why?" required value={reason} onChange={ev => setReason(ev.target.value)} placeholder="For example: not reachable after 3 calls, found a tutor elsewhere" />
      </Modal>
    </Modal>
  )
}
