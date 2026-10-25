'use client'

import { useEffect, useState } from 'react'
import Modal from '@/shared/ui/Modal'
import { btn } from '@/shared/ui/Card'
import { ChipGroup, TextArea } from '@/shared/ui/Form'

export function DeclineModal({ offer, masters, busy, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { setReason(''); setComment(''); setErr('') }, [offer])
  const submit = () => {
    if (!reason) return setErr('Choose a reason')
    if (reason === 'other' && comment.trim().length < 3) return setErr('Tell us briefly why')
    onSubmit({ reason, ...(comment ? { comment } : {}) }).catch(() => {})
    return undefined
  }
  return (
    <Modal open={!!offer} title="Decline this lead" onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Back</button><button type="button" className={btn.primary} disabled={busy} onClick={submit}>Decline lead</button></>}>
      <div className="space-y-4">
        <ChipGroup label="Reason" required single options={masters.rejectReasons} value={reason} onChange={setReason} error={err && !reason ? err : ''} />
        <TextArea label="Comment" hint={reason === 'other' ? 'Required' : 'Optional'} rows={2} value={comment} onChange={e => setComment(e.target.value)} error={err && reason ? err : ''} />
      </div>
    </Modal>
  )
}

export function AskModal({ offer, busy, onClose, onSubmit }) {
  const [text, setText] = useState('')
  useEffect(() => setText(''), [offer])
  return (
    <Modal open={!!offer} title="Ask our team about this lead" onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={busy || text.trim().length < 3} onClick={() => onSubmit(text.trim()).catch(() => {})}>Send question</button></>}>
      <TextArea label="Your question" required rows={3} maxLength={500} value={text} onChange={e => setText(e.target.value)} hint="The offer timer keeps running while you wait." />
    </Modal>
  )
}
