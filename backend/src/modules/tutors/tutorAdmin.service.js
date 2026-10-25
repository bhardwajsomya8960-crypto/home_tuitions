const { pageParams } = require('../../shared/utils/pagination')
const { mapSeries } = require('../../shared/utils/async')

// Tutor verification actions (blueprint §12.2): which statuses each action is allowed from.
const TUTOR_ACTIONS = {
  start_review: { from: ['pending', 'documents_submitted'], to: 'under_review' },
  verify: { from: ['documents_submitted', 'under_review'], to: 'verified' },
  activate: { from: ['verified', 'suspended'], to: 'active' },
  suspend: { from: ['active', 'verified'], to: 'suspended' },
  reject: { from: ['pending', 'documents_submitted', 'under_review'], to: 'rejected' },
}

// Staff view of tutors: lists, the review screen, document checks and account actions.
function createTutorAdminService(ctx, { documents }) {
  const { repo } = ctx

  const self = {
    async listTutors(query) {
      const { limit, offset, page } = pageParams(query)
      const statuses = Object.values(TUTOR_ACTIONS).map(a => a.to).concat('pending', 'documents_submitted')
      let items = await repo.find('Tutor', statuses.includes(query.status) ? { status: query.status } : {})
      const q = typeof query.q === 'string' ? query.q.trim().toLowerCase().slice(0, 80) : ''
      if (q) items = items.filter(t => [t.name, t.phone, t.email, t.pincode, ...t.subjects].some(v => v && String(v).toLowerCase().includes(q)))
      return { items: await mapSeries(items.slice(offset, offset + limit), self.tutorSummary), total: items.length, page, limit }
    },

    async tutorSummary(t) {
      return {
        id: t.id, name: t.name, phone: t.phone, email: t.email, status: t.status, subjects: t.subjects, classes: t.classes,
        modes: t.modes, pincode: t.pincode, experienceYears: t.experienceYears, ratingAvg: t.ratingAvg, ratingCount: t.ratingCount,
        acceptingLeads: t.acceptingLeads, createdAt: t.createdAt,
        activeStudents: await repo.count('Enrolment', { tutorId: t.id, status: 'active' }),
      }
    },

    async tutorDetail(tutorId) {
      const tutor = await ctx.require('Tutor', tutorId, 'Tutor')
      const offers = await repo.find('Assignment', { tutorId })
      return {
        ...tutor,
        documents: await documents.list(tutorId),
        requiredDocumentsAccepted: await documents.hasRequired(tutorId, { acceptedOnly: true }),
        offerStats: {
          total: offers.length,
          accepted: offers.filter(a => ['accepted', 'confirmed', 'released'].includes(a.status)).length,
          declined: offers.filter(a => ['rejected', 'unavailable'].includes(a.status)).length,
          expired: offers.filter(a => a.status === 'expired').length,
        },
        enrolments: await repo.find('Enrolment', { tutorId }),
        allowedActions: Object.entries(TUTOR_ACTIONS).filter(([, a]) => a.from.includes(tutor.status)).map(([k]) => k),
      }
    },

    async reviewDocument(docId, { status, reason } = {}, actor) {
      if (!['accepted', 'rejected'].includes(status)) throw ctx.invalid([{ field: 'status', message: 'must be accepted or rejected' }])
      if (status === 'rejected' && (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 300)) {
        throw ctx.invalid([{ field: 'reason', message: 'Tell the tutor why (3 to 300 characters)' }])
      }
      const doc = await ctx.require('TutorDocument', docId, 'Document')
      await repo.update('TutorDocument', doc.id, { status, rejectReason: status === 'rejected' ? reason.trim() : null, reviewedAt: ctx.iso() })
      await ctx.audit(actor, `tutor.document.${status}`, 'tutor', doc.tutorId, { documentId: doc.id, type: doc.type })
      return repo.get('TutorDocument', doc.id)
    },

    async tutorAction(tutorId, { action, notes } = {}, actor) {
      const rule = TUTOR_ACTIONS[action]
      if (!rule) throw ctx.invalid([{ field: 'action', message: `must be one of: ${Object.keys(TUTOR_ACTIONS).join(', ')}` }])
      if (notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) throw ctx.invalid([{ field: 'notes', message: 'must be text up to 500 characters' }])
      const tutor = await ctx.require('Tutor', tutorId, 'Tutor')
      if (!rule.from.includes(tutor.status)) throw ctx.conflict('INVALID_TRANSITION', `Cannot ${action.replace('_', ' ')} a tutor who is ${tutor.status}`)
      // Business rule 2: verification requires the KYC documents to have been checked.
      if (action === 'verify' && !(await documents.hasRequired(tutorId, { acceptedOnly: true }))) {
        throw ctx.conflict('DOCUMENTS_PENDING', 'Accept at least one profile photo, identity document and qualification before verifying')
      }
      if ((action === 'reject' || action === 'suspend') && !notes) throw ctx.invalid([{ field: 'notes', message: 'Add a reason' }])
      await repo.transaction(async () => {
        await repo.update('Tutor', tutorId, { status: rule.to, statusNotes: notes || null, updatedAt: ctx.iso() })
        if (rule.to === 'suspended') {
          for (const a of await repo.find('Assignment', { tutorId, status: 'offered' })) await repo.update('Assignment', a.id, { status: 'withdrawn', updatedAt: ctx.iso() })
        }
        await ctx.audit(actor, 'tutor.status', 'tutor', tutorId, { from: tutor.status, to: rule.to, notes })
      })
      return self.tutorDetail(tutorId)
    },
  }
  return self
}

module.exports = { createTutorAdminService, TUTOR_ACTIONS }
