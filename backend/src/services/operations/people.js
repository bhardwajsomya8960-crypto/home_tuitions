const fs = require('fs')
const path = require('path')
const { AppError } = require('../../errors')
const M = require('../masters')
const specs = require('../operationsSpecs')
const { needsLocation } = require('../matchingService')

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
// Accepted uploads, checked by file signature rather than the name or the browser's type.
const SIGNATURES = [
  { mime: 'application/pdf', ext: '.pdf', test: b => b.slice(0, 4).toString('latin1') === '%PDF' },
  { mime: 'image/jpeg', ext: '.jpg', test: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: '.png', test: b => b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
]
const REQUIRED_DOCS = M.DOCUMENT_TYPES.filter(d => d.required).map(d => d.value)

function createPeople(ctx, { geo, catalogueService, uploadsDir }) {
  const { repo } = ctx

  function checkConsent(consent, { location }) {
    const errors = []
    if (!consent || consent.terms !== true) errors.push({ field: 'consent.terms', message: 'You must accept the terms and privacy policy' })
    if (!consent || consent.communication !== true) errors.push({ field: 'consent.communication', message: 'We need your permission to contact you about this request' })
    if (location && (!consent || consent.location !== true)) errors.push({ field: 'consent.location', message: 'Location consent is required when sharing your location' })
    if (errors.length) throw ctx.invalid(errors)
  }

  // Address rules for a requirement. Coordinates come from the device (with consent) or geocoding.
  async function resolveLocation(req) {
    if (!needsLocation(req.mode)) return { address: req.address || null, pincode: req.pincode || null, latitude: null, longitude: null, geocodeSource: null }
    const errors = []
    if (!req.address) errors.push({ field: 'address', message: 'is required for home tuition' })
    if (!req.pincode) errors.push({ field: 'pincode', message: 'is required for home tuition' })
    if ((req.latitude === undefined) !== (req.longitude === undefined)) errors.push({ field: 'latitude', message: 'latitude and longitude must be sent together' })
    if (errors.length) throw ctx.invalid(errors)
    if (req.latitude !== undefined) return { address: req.address, pincode: req.pincode, latitude: req.latitude, longitude: req.longitude, geocodeSource: 'device' }
    const geocoded = await geo.geocodeAddress(req.address, req.pincode)
    if (geocoded) return { address: req.address, pincode: req.pincode, latitude: geocoded.latitude, longitude: geocoded.longitude, geocodeSource: 'address' }
    return { address: req.address, pincode: req.pincode, latitude: null, longitude: null, geocodeSource: 'pincode' }
  }

  function leadRecord({ parentId, studentId, req, location, source, course }) {
    const stamp = ctx.iso()
    return {
      id: ctx.newId(),
      code: repo.nextSequence('leads', 'HT-L-'),
      parentId,
      studentId,
      source,
      mode: req.mode,
      subjects: req.subjects,
      class: req.studentClass,
      board: req.board,
      preferredDays: req.preferredDays,
      preferredSlots: req.preferredSlots,
      prefGender: req.prefGender && req.prefGender !== 'No preference' ? req.prefGender : null,
      prefLanguages: req.prefLanguages || [],
      budgetRange: req.budgetRange || null,
      startDate: req.startDate || null,
      urgency: req.urgency || null,
      specialRequirements: req.specialRequirements || null,
      ...location,
      status: 'new',
      noTutorFound: false,
      courseId: course ? course.id : null,
      courseSlug: course ? course.slug : null,
      createdAt: stamp,
      updatedAt: stamp,
    }
  }

  function insertStudent(parentId, s) {
    const stamp = ctx.iso()
    return repo.insert('students', {
      id: ctx.newId(), parentId, name: s.studentName, class: s.studentClass, board: s.board,
      school: s.school || null, subjects: s.subjects || [], createdAt: stamp, updatedAt: stamp,
    })
  }

  // Leads from the same parent for the same student and subject within 30 days are flagged.
  function duplicateOf(parentId, studentId, subjects) {
    const since = new Date(ctx.now().getTime() - 30 * 24 * 3600 * 1000).toISOString()
    return repo.find('leads', { parentId, studentId }).find(l =>
      l.createdAt >= since && !['lost', 'cancelled'].includes(l.status) && l.subjects.some(s => subjects.includes(s)))
  }

  function createLead({ parent, student, req, location, source, course, actor, note }) {
    const dup = duplicateOf(parent.id, student.id, req.subjects)
    const lead = repo.insert('leads', leadRecord({ parentId: parent.id, studentId: student.id, req: { ...req, studentClass: student.class, board: student.board }, location, source, course }))
    ctx.event(lead.id, 'created', actor, { to: 'new', note: note || `Enquiry received via ${source}` })
    if (dup) ctx.event(lead.id, 'duplicate_suspected', 'system', { note: `Possible duplicate of ${dup.code}` })
    ctx.audit(actor, 'lead.create', 'lead', lead.id, { source })
    return lead
  }

  const self = {
    REQUIRED_DOCS,

    // ---- Parents -----------------------------------------------------------------------
    async registerParent(body, authService) {
      const v = ctx.validate(body, specs.parentRegistrationSpec)
      authService.verifyPhoneToken(v.phoneToken, v.phone, 'parent')
      checkConsent(v.consent, { location: v.latitude !== undefined })
      if (repo.findOne('parents', { phone: v.phone })) {
        throw ctx.conflict('ALREADY_REGISTERED', 'An account with this mobile number already exists. Sign in to add a new request.')
      }
      const course = await catalogueService.resolvePublicCourse({ courseId: v.courseId || null, courseSlug: v.courseSlug || null })
      const location = await resolveLocation(v)

      return repo.transaction(() => {
        const stamp = ctx.iso()
        const parent = repo.insert('parents', {
          id: ctx.newId(), name: v.name, phone: v.phone, email: v.email || null, relationship: v.relationship,
          address: location.address, pincode: location.pincode, latitude: location.latitude, longitude: location.longitude,
          consent: { ...v.consent, recordedAt: stamp }, status: 'active', createdAt: stamp, updatedAt: stamp,
        })
        const student = insertStudent(parent.id, { ...v, subjects: v.subjects })
        const lead = createLead({ parent, student, req: v, location, source: v.source || 'website', course, actor: `parent:${parent.id}` })
        ctx.audit(`parent:${parent.id}`, 'parent.register', 'parent', parent.id)
        return { parent, student, lead }
      })
    },

    getParent(parentId) {
      return ctx.require('parents', parentId, 'Parent')
    },

    listStudents(parentId) {
      return repo.find('students', { parentId }, { orderBy: 'created_at ASC' })
    },

    addStudent(parentId, body) {
      const v = ctx.validate(body, specs.studentSpec)
      const student = insertStudent(parentId, v)
      ctx.audit(`parent:${parentId}`, 'student.create', 'student', student.id)
      return student
    },

    async createParentRequest(parentId, body) {
      const v = ctx.validate(body, specs.parentRequestSpec)
      const parent = self.getParent(parentId)
      if (v.latitude !== undefined && v.locationConsent !== true) {
        throw ctx.invalid([{ field: 'locationConsent', message: 'Location consent is required when sharing your location' }])
      }
      let student
      if (v.studentId) {
        student = repo.get('students', v.studentId)
        if (!student || student.parentId !== parentId) throw ctx.notFound('Student')
      } else {
        const missing = ['studentName', 'studentClass', 'board'].filter(k => !v[k]).map(field => ({ field, message: 'is required for a new student' }))
        if (missing.length) throw ctx.invalid(missing)
      }
      const location = await resolveLocation({ ...v, address: v.address || parent.address, pincode: v.pincode || parent.pincode })
      return repo.transaction(() => {
        if (!student) student = insertStudent(parentId, v)
        return createLead({ parent, student, req: v, location, source: 'website', actor: `parent:${parentId}`, note: 'New request from the parent portal' })
      })
    },

    // Staff-entered lead (BDA). Reuses the parent account when the number is known.
    async createStaffLead(body, actor) {
      const v = ctx.validate(body, specs.staffLeadSpec)
      const location = await resolveLocation(v)
      return repo.transaction(() => {
        const stamp = ctx.iso()
        let parent = repo.findOne('parents', { phone: v.phone })
        if (!parent) {
          parent = repo.insert('parents', {
            id: ctx.newId(), name: v.name, phone: v.phone, email: v.email || null, relationship: v.relationship,
            address: location.address, pincode: location.pincode, latitude: location.latitude, longitude: location.longitude,
            consent: { recordedBy: actor, recordedAt: stamp, note: 'Created by staff; consent to be confirmed with the parent' },
            status: 'active', createdAt: stamp, updatedAt: stamp,
          })
        }
        const student = repo.find('students', { parentId: parent.id }).find(s => s.name.toLowerCase() === v.studentName.toLowerCase())
          || insertStudent(parent.id, v)
        return createLead({ parent, student, req: v, location, source: v.source, actor, note: v.note })
      })
    },

    // ---- Tutors ------------------------------------------------------------------------
    async registerTutor(body, authService) {
      const v = ctx.validate(body, specs.tutorRegistrationSpec)
      authService.verifyPhoneToken(v.phoneToken, v.phone, 'tutor')
      checkConsent(v.consent, { location: v.latitude !== undefined })
      if (v.feeMin !== undefined && v.feeMax !== undefined && v.feeMin > v.feeMax) {
        throw ctx.invalid([{ field: 'feeMax', message: 'must be at least the minimum fee' }])
      }
      if (repo.findOne('tutors', { phone: v.phone })) {
        throw ctx.conflict('ALREADY_REGISTERED', 'A tutor account with this mobile number already exists. Sign in instead.')
      }
      let { latitude, longitude } = v
      if (latitude === undefined) {
        const geocoded = await geo.geocodeAddress(v.address, v.pincode)
        if (geocoded) ({ latitude, longitude } = geocoded)
      }
      const stamp = ctx.iso()
      const { phoneToken, consent, ...fields } = v
      const tutor = repo.insert('tutors', {
        ...fields,
        id: ctx.newId(),
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        serviceRadiusKm: v.serviceRadiusKm ?? ctx.settings().defaultHomeRadiusKm,
        feeMin: v.feeMin ?? null,
        feeMax: v.feeMax ?? null,
        acceptingLeads: true,
        status: 'pending',
        ratingCount: 0,
        consent: { ...consent, recordedAt: stamp },
        createdAt: stamp,
        updatedAt: stamp,
      })
      ctx.audit(`tutor:${tutor.id}`, 'tutor.register', 'tutor', tutor.id)
      return tutor
    },

    getTutor(tutorId) {
      return ctx.require('tutors', tutorId, 'Tutor')
    },

    updateTutor(tutorId, body) {
      const v = ctx.validate(body, specs.tutorUpdateSpec, { partial: true })
      const tutor = self.getTutor(tutorId)
      const feeMin = v.feeMin ?? tutor.feeMin
      const feeMax = v.feeMax ?? tutor.feeMax
      if (feeMin != null && feeMax != null && feeMin > feeMax) throw ctx.invalid([{ field: 'feeMax', message: 'must be at least the minimum fee' }])
      repo.update('tutors', tutorId, { ...v, updatedAt: ctx.iso() })
      ctx.audit(`tutor:${tutorId}`, 'tutor.update', 'tutor', tutorId, { fields: Object.keys(v) })
      return self.getTutor(tutorId)
    },

    // ---- Tutor documents (KYC) ---------------------------------------------------------
    uploadDocument(tutorId, type, file) {
      const tutor = self.getTutor(tutorId)
      if (!M.values(M.DOCUMENT_TYPES).includes(type)) throw ctx.invalid([{ field: 'type', message: 'is not a known document type' }])
      if (!file || !file.buffer || file.size === 0) throw ctx.invalid([{ field: 'file', message: 'is required' }])
      if (file.size > MAX_UPLOAD_BYTES) throw new AppError(413, 'FILE_TOO_LARGE', 'Files must be 5 MB or smaller')
      const kind = SIGNATURES.find(sig => sig.test(file.buffer))
      if (!kind || (type === 'photo' && kind.mime === 'application/pdf')) {
        throw new AppError(415, 'UNSUPPORTED_FILE', type === 'photo' ? 'Photos must be JPG or PNG' : 'Upload a PDF, JPG or PNG file')
      }
      if (['suspended', 'rejected'].includes(tutor.status)) throw ctx.conflict('TUTOR_LOCKED', 'Documents cannot be changed for this account. Contact support.')

      const id = ctx.newId()
      const storageKey = `${id}${kind.ext}`
      fs.mkdirSync(uploadsDir, { recursive: true })
      fs.writeFileSync(path.join(uploadsDir, storageKey), file.buffer, { mode: 0o600 })
      const doc = repo.insert('tutor_documents', {
        id, tutorId, type, originalName: String(file.originalname || 'upload').slice(0, 120), mimeType: kind.mime,
        sizeBytes: file.size, storageKey, status: 'submitted', createdAt: ctx.iso(),
      })
      ctx.audit(`tutor:${tutorId}`, 'tutor.document.upload', 'tutor', tutorId, { type })

      if (tutor.status === 'pending' && self.hasRequiredDocuments(tutorId)) {
        repo.update('tutors', tutorId, { status: 'documents_submitted', updatedAt: ctx.iso() })
        ctx.audit('system', 'tutor.status', 'tutor', tutorId, { from: 'pending', to: 'documents_submitted' })
      }
      return doc
    },

    listDocuments(tutorId) {
      return repo.find('tutor_documents', { tutorId })
    },

    // Latest upload per required type, not rejected.
    hasRequiredDocuments(tutorId, { acceptedOnly = false } = {}) {
      const docs = repo.find('tutor_documents', { tutorId })
      return REQUIRED_DOCS.every(type => {
        const latest = docs.find(d => d.type === type)
        return latest && (acceptedOnly ? latest.status === 'accepted' : latest.status !== 'rejected')
      })
    },

    documentFile(docId) {
      const doc = ctx.require('tutor_documents', docId, 'Document')
      return { doc, path: path.join(uploadsDir, path.basename(doc.storageKey)) }
    },
  }
  return self
}

module.exports = { createPeople, MAX_UPLOAD_BYTES }
