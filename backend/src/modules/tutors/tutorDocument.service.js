const path = require('path')
const { AppError } = require('../../shared/errors')
const M = require('../../shared/masters')

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const MAX_DOCS_PER_TYPE = 10
// Accepted uploads, checked by file signature rather than the name or the browser's type.
const SIGNATURES = [
  { mime: 'application/pdf', ext: '.pdf', test: b => b.slice(0, 4).toString('latin1') === '%PDF' },
  { mime: 'image/jpeg', ext: '.jpg', test: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: '.png', test: b => b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
]
const REQUIRED_DOCS = M.DOCUMENT_TYPES.filter(d => d.required).map(d => d.value)
const LOCKED = ['suspended', 'rejected']

// Tutor KYC documents. Files go to `storage` (S3 in production); MongoDB keeps the details.
function createTutorDocumentService(ctx, { storage }) {
  const { repo } = ctx

  const self = {
    REQUIRED_DOCS,

    // details: { title, description } from the form. Every type except the photo needs a name.
    async upload(tutorId, type, file, details = {}) {
      const tutor = await ctx.require('Tutor', tutorId, 'Tutor')
      const docType = M.DOCUMENT_TYPES.find(d => d.value === type)
      if (!docType) throw ctx.invalid([{ field: 'type', message: 'is not a known document type' }])
      const title = typeof details.title === 'string' ? details.title.trim() : ''
      const description = typeof details.description === 'string' ? details.description.trim() : ''
      const errors = []
      if (docType.multiple && title.length < 2) errors.push({ field: 'title', message: 'is required' })
      if (title.length > 120) errors.push({ field: 'title', message: 'must be 120 characters or fewer' })
      if (description.length > 500) errors.push({ field: 'description', message: 'must be 500 characters or fewer' })
      if (errors.length) throw ctx.invalid(errors)
      if (!file || !file.buffer || file.size === 0) throw ctx.invalid([{ field: 'file', message: 'is required' }])
      if (file.size > MAX_UPLOAD_BYTES) throw new AppError(413, 'FILE_TOO_LARGE', 'Files must be 5 MB or smaller')
      const kind = SIGNATURES.find(sig => sig.test(file.buffer))
      if (!kind || (type === 'photo' && kind.mime === 'application/pdf')) {
        throw new AppError(415, 'UNSUPPORTED_FILE', type === 'photo' ? 'Photos must be JPG or PNG' : 'Upload a PDF, JPG or PNG file')
      }
      if (LOCKED.includes(tutor.status)) throw ctx.conflict('TUTOR_LOCKED', 'Documents cannot be changed for this account. Contact support.')
      if (await repo.count('TutorDocument', { tutorId, type }) >= MAX_DOCS_PER_TYPE) {
        throw ctx.conflict('TOO_MANY_DOCUMENTS', `You can add up to ${MAX_DOCS_PER_TYPE} files here. Remove one you no longer need first.`)
      }

      const id = ctx.newId()
      const storageKey = `${tutorId}/${id}${kind.ext}`
      await storage.put(storageKey, file.buffer, kind.mime)
      const doc = await repo.insert('TutorDocument', {
        id, tutorId, type, title: title || docType.label, description: description || null,
        originalName: String(file.originalname || 'upload').slice(0, 120), mimeType: kind.mime,
        sizeBytes: file.size, storageKey, status: 'submitted', createdAt: ctx.iso(),
      })
      await ctx.audit(`tutor:${tutorId}`, 'tutor.document.upload', 'tutor', tutorId, { type })

      if (tutor.status === 'pending' && await self.hasRequired(tutorId)) {
        await repo.update('Tutor', tutorId, { status: 'documents_submitted', updatedAt: ctx.iso() })
        await ctx.audit('system', 'tutor.status', 'tutor', tutorId, { from: 'pending', to: 'documents_submitted' })
      }
      return doc
    },

    // A tutor can remove a document that has not been accepted (a wrong file, or one we rejected).
    async remove(tutorId, docId) {
      const tutor = await ctx.require('Tutor', tutorId, 'Tutor')
      const doc = await repo.get('TutorDocument', docId)
      if (!doc || doc.tutorId !== tutorId) throw ctx.notFound('Document')
      if (doc.status === 'accepted') throw ctx.conflict('DOCUMENT_ACCEPTED', 'Accepted documents cannot be removed. Contact support if it needs to change.')
      if (LOCKED.includes(tutor.status)) throw ctx.conflict('TUTOR_LOCKED', 'Documents cannot be changed for this account. Contact support.')
      await repo.transaction(async () => {
        await repo.remove('TutorDocument', doc.id)
        await ctx.audit(`tutor:${tutorId}`, 'tutor.document.delete', 'tutor', tutorId, { documentId: doc.id, type: doc.type })
        if (tutor.status === 'documents_submitted' && !(await self.hasRequired(tutorId))) {
          await repo.update('Tutor', tutorId, { status: 'pending', updatedAt: ctx.iso() })
          await ctx.audit('system', 'tutor.status', 'tutor', tutorId, { from: 'documents_submitted', to: 'pending' })
        }
      })
      await storage.remove(doc.storageKey).catch(err => console.error('Could not delete stored file', doc.storageKey, err.message))
    },

    list(tutorId) {
      return repo.find('TutorDocument', { tutorId })
    },

    // Every required type has at least one document that is not rejected (or, for verification, accepted).
    async hasRequired(tutorId, { acceptedOnly = false } = {}) {
      const docs = await repo.find('TutorDocument', { tutorId })
      return REQUIRED_DOCS.every(type => docs.some(d => d.type === type && (acceptedOnly ? d.status === 'accepted' : d.status !== 'rejected')))
    },

    // The document and a readable stream of its file. Callers check who may see it.
    async open(docId) {
      const doc = await ctx.require('TutorDocument', docId, 'Document')
      let stream
      try {
        stream = await storage.open(doc.storageKey)
      } catch {
        throw ctx.notFound('File')
      }
      return { doc, stream, filename: path.basename(doc.originalName) }
    },
  }
  return self
}

module.exports = { createTutorDocumentService, MAX_UPLOAD_BYTES }
