'use client'

import { useState } from 'react'
import { FiUpload, FiEye, FiPlus, FiTrash2 } from 'react-icons/fi'
import Modal from '@/shared/ui/Modal'
import SimpleTable from '@/shared/ui/SimpleTable'
import { StatusBadge } from '@/shared/ui/Badge'
import { btn, Card } from '@/shared/ui/Card'
import { api, openProtectedFile } from '@/shared/lib/api'
import { DOC_STATUS, formatDate, TUTOR_STATUS } from '@/shared/lib/format'
import { AddDocumentModal } from '@/features/tutor/components/verification/AddDocumentModal'
import { TUTOR_API } from '@/features/tutor/api/endpoints'

// Wording for each document section. Every type except the photo takes several named files.
export const DOC_SECTIONS = {
  photo: { hint: 'A clear, recent photo of your face. JPG or PNG.' },
  identity: { hint: 'Aadhaar, PAN, passport or driving licence. Add each one separately.', noun: 'identity document', nameLabel: 'Document name', placeholder: 'For example: Aadhaar card' },
  qualification: { hint: 'Degrees, diplomas and teaching certificates. Add each one separately.', noun: 'qualification', nameLabel: 'Certificate name', placeholder: 'For example: MSc Mathematics' },
  experience: { hint: 'Experience letters or certificates from schools or institutes.', noun: 'experience proof', nameLabel: 'Document name', placeholder: 'For example: Experience letter, ABC School' },
}

export const fileSize = bytes => `${Math.max(1, Math.round(bytes / 1024))} KB`

export function VerificationTab({ tutor, masters, busy, onUpload, onRemove }) {
  const [adding, setAdding] = useState(null)
  const [removing, setRemoving] = useState(null)
  const viewFile = doc => openProtectedFile(TUTOR_API.documentFile(doc.id), 'tutor').catch(() => {})

  return (
    <div className="space-y-4">
      <Card title="Account status" actions={<StatusBadge map={TUTOR_STATUS} value={tutor.status} />}>
        <ol className="flex flex-wrap gap-2 text-xs">
          {['pending', 'documents_submitted', 'under_review', 'verified', 'active'].map((s, i, all) => {
            const reached = all.indexOf(tutor.status) >= i
            return <li key={s} className={`rounded-full px-3 py-1 font-semibold ${reached ? 'bg-green-100 text-green-800' : 'bg-sand-100 text-sage'}`}>{i + 1}. {TUTOR_STATUS[s].label}</li>
          })}
        </ol>
        {tutor.statusNotes && <p className="mt-3 text-sm text-sage">Note from our team: {tutor.statusNotes}</p>}
      </Card>
      <p className="text-sm text-sage">Files can be PDF, JPG or PNG, up to 5 MB each. Sections marked <span className="text-red-600">*</span> need at least one file.</p>

      {masters.documentTypes.map(type => {
        const section = DOC_SECTIONS[type.value] || {}
        const docs = tutor.documents.filter(d => d.type === type.value)
        const title = <>{type.label}{type.required && <span className="text-red-600"> *</span>}</>
        const action = type.multiple
          ? <button type="button" className={btn.primary} disabled={busy} onClick={() => setAdding(type)}><FiPlus aria-hidden="true" /> Add {section.noun || 'document'}</button>
          : (
            <label className={`${btn.primary} cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}>
              <FiUpload aria-hidden="true" /> {docs.length ? 'Replace photo' : 'Upload photo'}
              <input type="file" className="sr-only" accept="image/jpeg,image/png"
                onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) onUpload(type.value, file, {}).catch(() => {}) }} />
            </label>
          )
        // The photo shows only the latest upload; other sections list every file.
        const rows = type.multiple ? docs : docs.slice(0, 1)
        return (
          <Card key={type.value} title={title} subtitle={section.hint} actions={action}>
            <SimpleTable rows={rows} minWidth={720} empty={type.multiple ? `No ${section.noun || 'document'} added yet.` : 'No photo uploaded yet.'} columns={[
              { key: 'name', header: 'Name', render: d => <span className="flex flex-col"><span className="font-medium">{d.title || type.label}</span>{d.description && <span className="text-xs text-sage">{d.description}</span>}</span> },
              { key: 'file', header: 'File', render: d => <span className="text-xs">{d.originalName} · {fileSize(d.sizeBytes)}</span> },
              { key: 'date', header: 'Uploaded', render: d => formatDate(d.createdAt) },
              { key: 'status', header: 'Status', render: d => <span className="flex flex-col items-start gap-1"><StatusBadge map={DOC_STATUS} value={d.status} />{d.rejectReason && <span className="text-xs text-red-700">{d.rejectReason}</span>}</span> },
              { key: 'act', header: '', align: 'right', sticky: true, render: d => (
                <span className="inline-flex gap-2">
                  <button type="button" className={btn.secondary} onClick={() => viewFile(d)}><FiEye aria-hidden="true" /> View</button>
                  {type.multiple && d.status !== 'accepted' && <button type="button" className={btn.danger} disabled={busy} onClick={() => setRemoving(d)} aria-label={`Remove ${d.title}`}><FiTrash2 aria-hidden="true" /> Remove</button>}
                </span>
              ) },
            ]} />
          </Card>
        )
      })}

      <AddDocumentModal type={adding} section={adding ? DOC_SECTIONS[adding.value] || {} : {}} busy={busy} onClose={() => setAdding(null)}
        onSubmit={(file, details) => onUpload(adding.value, file, details).then(() => setAdding(null))} />
      <Modal open={!!removing} title="Remove document" onClose={() => setRemoving(null)}
        footer={<><button type="button" className={btn.secondary} onClick={() => setRemoving(null)}>Cancel</button>
          <button type="button" className={btn.danger} disabled={busy} onClick={() => onRemove(removing.id).then(() => setRemoving(null)).catch(() => {})}>Remove</button></>}>
        {removing && <p className="text-sm">Remove <strong>{removing.title}</strong> ({removing.originalName})? You can add it again later.</p>}
      </Modal>
    </div>
  )
}
