'use client'

import { useEffect, useState } from 'react'
import { FiUpload } from 'react-icons/fi'
import Modal from '@/shared/ui/Modal'
import { btn } from '@/shared/ui/Card'
import { Notice, TextArea, TextInput } from '@/shared/ui/Form'
import { fileSize } from '@/features/tutor/components/verification/VerificationTab'

// Adds one named document: name (required), description (optional) and the file.
export function AddDocumentModal({ type, section, busy, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { if (type) { setTitle(''); setDescription(''); setFile(null); setError('') } }, [type])

  const submit = e => {
    e.preventDefault()
    if (title.trim().length < 2) return setError(`Enter the ${(section.nameLabel || 'document name').toLowerCase()}.`)
    if (!file) return setError('Choose a file to upload.')
    if (file.size > 5 * 1024 * 1024) return setError('Files must be 5 MB or smaller.')
    setError('')
    onSubmit(file, { title: title.trim(), description: description.trim() }).catch(err => setError(err.message))
  }

  return (
    <Modal open={!!type} title={`Add ${section.noun || 'document'}`} onClose={onClose}
      footer={<><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button>
        <button type="submit" form="add-document" className={btn.primary} disabled={busy}>{busy ? 'Uploading…' : 'Add'}</button></>}>
      <form id="add-document" onSubmit={submit} className="space-y-4" noValidate>
        <TextInput label={section.nameLabel || 'Document name'} required maxLength={120} value={title} onChange={e => { setTitle(e.target.value); setError('') }} placeholder={section.placeholder} />
        <TextArea label="Description" hint="Optional. For example the university, board or year." rows={2} maxLength={500} value={description} onChange={e => setDescription(e.target.value)} />
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">File <span className="text-red-600">*</span></p>
          <label className="flex cursor-pointer flex-wrap items-center gap-3 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-3 text-sm hover:border-ink/40">
            <span className={btn.secondary}><FiUpload aria-hidden="true" /> Choose file</span>
            <span className={file ? 'font-medium text-ink' : 'text-sage'}>{file ? `${file.name} · ${fileSize(file.size)}` : 'PDF, JPG or PNG, up to 5 MB'}</span>
            <input type="file" aria-label="File" className="sr-only" accept="application/pdf,image/jpeg,image/png" onChange={e => { setFile(e.target.files?.[0] || null); setError('') }} />
          </label>
        </div>
        <Notice>{error}</Notice>
      </form>
    </Modal>
  )
}
