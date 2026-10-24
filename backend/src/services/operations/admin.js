const M = require('../masters')
const { validateSettings, DEFAULT_SETTINGS } = require('../matchingService')
const { pageParams } = require('./context')
const { addDays } = require('./delivery')

// Tutor verification actions (blueprint §12.2): which statuses each action is allowed from.
const TUTOR_ACTIONS = {
  start_review: { from: ['pending', 'documents_submitted'], to: 'under_review' },
  verify: { from: ['documents_submitted', 'under_review'], to: 'verified' },
  activate: { from: ['verified', 'suspended'], to: 'active' },
  suspend: { from: ['active', 'verified'], to: 'suspended' },
  reject: { from: ['pending', 'documents_submitted', 'under_review'], to: 'rejected' },
}

function createAdmin(ctx, { views, people, delivery }) {
  const { repo } = ctx

  const self = {
    dashboard() {
      const leads = repo.countBy('leads', 'status')
      const tutors = repo.countBy('tutors', 'status')
      const totalLeads = Object.values(leads).reduce((a, b) => a + b, 0)
      const { collected, outstanding } = repo.invoiceTotals()
      const weekAhead = addDays(ctx.today(), 7)
      return {
        leads: { total: totalLeads, byStatus: Object.fromEntries(M.LEAD_STATUSES.map(s => [s, leads[s] || 0])) },
        conversionRate: totalLeads ? Math.round(((leads.converted || 0) / totalLeads) * 1000) / 10 : 0,
        tutors: { total: Object.values(tutors).reduce((a, b) => a + b, 0), byStatus: tutors, awaitingReview: (tutors.documents_submitted || 0) + (tutors.under_review || 0) },
        operations: {
          openOffers: repo.count('assignments', { status: 'offered' }),
          awaitingConfirmation: repo.count('assignments', { status: 'accepted' }),
          noTutorQueue: repo.count('leads', { noTutorFound: true, status: ['matching', 'tutor_offered'] }),
          upcomingDemos: repo.find('demos', { status: 'scheduled' }).filter(d => d.scheduledAt.slice(0, 10) <= weekAhead).length,
        },
        enrolments: { active: repo.count('enrolments', { status: 'active' }) },
        finance: { collected, outstanding, overdue: repo.overdueTotal(ctx.today()) },
      }
    },

    listLeads(query) {
      const { limit, offset, page } = pageParams(query)
      const filters = {}
      if (M.LEAD_STATUSES.includes(query.status)) filters.status = query.status
      if (M.LEAD_SOURCES.includes(query.source)) filters.source = query.source
      if (M.LEAD_MODES.includes(query.mode)) filters.mode = query.mode
      if (query.noTutor === 'true') filters.noTutorFound = true
      let items = repo.find('leads', filters).map(views.leadSummary)
      const q = typeof query.q === 'string' ? query.q.trim().toLowerCase().slice(0, 80) : ''
      if (q) items = items.filter(l => [l.code, l.parentName, l.parentPhone, l.studentName, l.pincode, ...l.subjects].some(v => v && String(v).toLowerCase().includes(q)))
      return { items: items.slice(offset, offset + limit), total: items.length, page, limit }
    },

    leadDetail(leadId) {
      return views.adminLead(ctx.require('leads', leadId, 'Lead'))
    },

    changeLeadStatus(leadId, { status, reason, note } = {}, actor) {
      const lead = ctx.require('leads', leadId, 'Lead')
      if (!(M.MANUAL_LEAD_TRANSITIONS[lead.status] || []).includes(status)) {
        throw ctx.conflict('INVALID_TRANSITION', `A lead in "${lead.status}" cannot be moved to "${status}" by hand`)
      }
      if (status === 'lost' && !M.values(M.LOST_REASONS).includes(reason)) throw ctx.invalid([{ field: 'reason', message: 'Choose why the lead was lost' }])
      if (note !== undefined && (typeof note !== 'string' || note.length > 1000)) throw ctx.invalid([{ field: 'note', message: 'must be text up to 1000 characters' }])
      return repo.transaction(() => {
        // Closing a lead withdraws its open offers so tutors are not left waiting.
        if (['lost', 'cancelled', 'on_hold'].includes(status)) {
          for (const a of repo.find('assignments', { leadId, status: 'offered' })) repo.update('assignments', a.id, { status: 'withdrawn', updatedAt: ctx.iso() })
        }
        const moved = ctx.moveLead(lead, status, actor, { note: [reason && M.LOST_REASONS.find(r => r.value === reason)?.label, note].filter(Boolean).join(' — ') || null })
        if (!moved) throw ctx.conflict('STALE', 'The lead changed while you were editing. Reload and try again.')
        if (status === 'lost') repo.update('leads', leadId, { lostReason: reason })
        return views.adminLead(repo.get('leads', leadId))
      })
    },

    addLeadNote(leadId, note, actor) {
      ctx.require('leads', leadId, 'Lead')
      if (typeof note !== 'string' || note.trim().length === 0 || note.length > 1000) throw ctx.invalid([{ field: 'note', message: 'must be 1 to 1000 characters' }])
      ctx.event(leadId, 'note', actor, { note: note.trim() })
      return views.adminLead(repo.get('leads', leadId))
    },

    updateLeadLocation(leadId, body, actor) {
      const v = ctx.validate(body, require('../operationsSpecs').locationSpec, { partial: true })
      if ((v.latitude === undefined) !== (v.longitude === undefined)) throw ctx.invalid([{ field: 'latitude', message: 'latitude and longitude must be sent together' }])
      ctx.require('leads', leadId, 'Lead')
      repo.update('leads', leadId, { ...v, ...(v.latitude !== undefined ? { geocodeSource: 'staff' } : {}), updatedAt: ctx.iso() })
      ctx.event(leadId, 'location_updated', actor)
      ctx.audit(actor, 'lead.location', 'lead', leadId)
      return views.adminLead(repo.get('leads', leadId))
    },

    // ---- Operations queues (blueprint §10.6) ------------------------------------------
    operations() {
      const leadCode = id => repo.get('leads', id)?.code
      const tutorName = id => repo.get('tutors', id)?.name
      const withNames = a => ({ ...a, leadCode: leadCode(a.leadId), tutorName: tutorName(a.tutorId) })
      const escalatedLeadIds = new Set(repo.find('lead_events', { type: 'escalated' }).map(e => e.leadId))
      return {
        openOffers: repo.find('assignments', { status: 'offered' }, { orderBy: 'expires_at ASC' }).map(withNames),
        awaitingConfirmation: repo.find('assignments', { status: 'accepted' }, { orderBy: 'responded_at ASC' }).map(withNames),
        infoRequests: repo.find('assignments', { status: 'offered' }).filter(a => a.infoRequest).map(withNames),
        noTutor: repo.find('leads', { noTutorFound: true, status: ['matching', 'tutor_offered'] }).map(views.leadSummary),
        escalations: [...escalatedLeadIds].map(id => repo.get('leads', id)).filter(l => l && !['converted', 'lost', 'cancelled'].includes(l.status)).map(views.leadSummary),
        upcomingDemos: repo.find('demos', { status: 'scheduled' }, { orderBy: 'scheduled_at ASC' }).map(d => ({ ...d, leadCode: leadCode(d.leadId), tutorName: tutorName(d.tutorId) })),
      }
    },

    // ---- Tutors ------------------------------------------------------------------------
    listTutors(query) {
      const { limit, offset, page } = pageParams(query)
      const statuses = Object.values(TUTOR_ACTIONS).map(a => a.to).concat('pending', 'documents_submitted')
      let items = repo.find('tutors', statuses.includes(query.status) ? { status: query.status } : {})
      const q = typeof query.q === 'string' ? query.q.trim().toLowerCase().slice(0, 80) : ''
      if (q) items = items.filter(t => [t.name, t.phone, t.email, t.pincode, ...t.subjects].some(v => v && String(v).toLowerCase().includes(q)))
      return { items: items.slice(offset, offset + limit).map(self.tutorSummary), total: items.length, page, limit }
    },

    tutorSummary(t) {
      return {
        id: t.id, name: t.name, phone: t.phone, email: t.email, status: t.status, subjects: t.subjects, classes: t.classes,
        modes: t.modes, pincode: t.pincode, experienceYears: t.experienceYears, ratingAvg: t.ratingAvg, ratingCount: t.ratingCount,
        acceptingLeads: t.acceptingLeads, createdAt: t.createdAt,
        activeStudents: repo.count('enrolments', { tutorId: t.id, status: 'active' }),
      }
    },

    tutorDetail(tutorId) {
      const tutor = people.getTutor(tutorId)
      const offers = repo.find('assignments', { tutorId })
      return {
        ...tutor,
        documents: people.listDocuments(tutorId),
        requiredDocumentsAccepted: people.hasRequiredDocuments(tutorId, { acceptedOnly: true }),
        offerStats: {
          total: offers.length,
          accepted: offers.filter(a => ['accepted', 'confirmed', 'released'].includes(a.status)).length,
          declined: offers.filter(a => ['rejected', 'unavailable'].includes(a.status)).length,
          expired: offers.filter(a => a.status === 'expired').length,
        },
        enrolments: repo.find('enrolments', { tutorId }),
        allowedActions: Object.entries(TUTOR_ACTIONS).filter(([, a]) => a.from.includes(tutor.status)).map(([k]) => k),
      }
    },

    reviewDocument(docId, { status, reason } = {}, actor) {
      if (!['accepted', 'rejected'].includes(status)) throw ctx.invalid([{ field: 'status', message: 'must be accepted or rejected' }])
      if (status === 'rejected' && (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 300)) {
        throw ctx.invalid([{ field: 'reason', message: 'Tell the tutor why (3 to 300 characters)' }])
      }
      const doc = ctx.require('tutor_documents', docId, 'Document')
      repo.update('tutor_documents', doc.id, { status, rejectReason: status === 'rejected' ? reason.trim() : null, reviewedAt: ctx.iso() })
      ctx.audit(actor, `tutor.document.${status}`, 'tutor', doc.tutorId, { documentId: doc.id, type: doc.type })
      return repo.get('tutor_documents', doc.id)
    },

    tutorAction(tutorId, { action, notes } = {}, actor) {
      const rule = TUTOR_ACTIONS[action]
      if (!rule) throw ctx.invalid([{ field: 'action', message: `must be one of: ${Object.keys(TUTOR_ACTIONS).join(', ')}` }])
      if (notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) throw ctx.invalid([{ field: 'notes', message: 'must be text up to 500 characters' }])
      const tutor = people.getTutor(tutorId)
      if (!rule.from.includes(tutor.status)) throw ctx.conflict('INVALID_TRANSITION', `Cannot ${action.replace('_', ' ')} a tutor who is ${tutor.status}`)
      // Business rule 2: verification requires the KYC documents to have been checked.
      if (action === 'verify' && !people.hasRequiredDocuments(tutorId, { acceptedOnly: true })) {
        throw ctx.conflict('DOCUMENTS_PENDING', 'Accept the photo, identity and qualification documents before verifying')
      }
      if ((action === 'reject' || action === 'suspend') && !notes) throw ctx.invalid([{ field: 'notes', message: 'Add a reason' }])
      return repo.transaction(() => {
        repo.update('tutors', tutorId, { status: rule.to, statusNotes: notes || null, updatedAt: ctx.iso() })
        if (rule.to === 'suspended') {
          for (const a of repo.find('assignments', { tutorId, status: 'offered' })) repo.update('assignments', a.id, { status: 'withdrawn', updatedAt: ctx.iso() })
        }
        ctx.audit(actor, 'tutor.status', 'tutor', tutorId, { from: tutor.status, to: rule.to, notes })
        return self.tutorDetail(tutorId)
      })
    },

    // ---- Settings ----------------------------------------------------------------------
    getSettings() {
      return { settings: ctx.settings(), defaults: DEFAULT_SETTINGS }
    },

    updateSettings(body, actor) {
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw ctx.invalid([{ field: '_body', message: 'must be a JSON object' }])
      const unknown = Object.keys(body).filter(k => !(k in DEFAULT_SETTINGS))
      if (unknown.length) throw ctx.invalid(unknown.map(field => ({ field, message: 'is not a setting' })))
      const next = { ...ctx.settings(), ...body, weights: { ...ctx.settings().weights, ...(body.weights || {}) } }
      const problems = validateSettings(next)
      if (problems.length) throw ctx.invalid(problems.map(message => ({ field: 'settings', message })))
      const before = ctx.settings()
      repo.saveSetting('matching', next, ctx.iso(), actor)
      ctx.audit(actor, 'settings.update', 'settings', 'matching', { before, after: next })
      return self.getSettings()
    },

    // ---- Finance -----------------------------------------------------------------------
    listInvoices(query) {
      const { limit, offset, page } = pageParams(query)
      const filters = ['pending', 'partial', 'paid', 'void'].includes(query.status) ? { status: query.status } : {}
      let items = repo.find('invoices', filters).map(delivery.invoiceView)
      if (query.overdue === 'true') items = items.filter(i => i.overdue)
      const named = items.map(i => ({ ...i, parentName: repo.get('parents', i.parentId)?.name, studentName: repo.get('students', i.studentId)?.name }))
      return { items: named.slice(offset, offset + limit), total: named.length, page, limit }
    },

    listEnrolments(query) {
      const { limit, offset, page } = pageParams(query)
      const filters = ['active', 'paused', 'completed', 'cancelled'].includes(query.status) ? { status: query.status } : {}
      const items = repo.find('enrolments', filters).map(e => ({
        ...e,
        studentName: repo.get('students', e.studentId)?.name,
        parentName: repo.get('parents', e.parentId)?.name,
        tutorName: repo.get('tutors', e.tutorId)?.name,
        leadCode: repo.get('leads', e.leadId)?.code,
      }))
      return { items: items.slice(offset, offset + limit), total: items.length, page, limit }
    },

    listAudit(query) {
      const { limit, offset, page } = pageParams(query)
      const filters = {}
      if (typeof query.entity === 'string' && query.entity) filters.entity = query.entity
      if (typeof query.entityId === 'string' && query.entityId) filters.entityId = query.entityId
      const total = repo.count('audit_log', filters)
      return { items: repo.find('audit_log', filters, { limit, offset }), total, page, limit }
    },
  }
  return self
}

module.exports = { createAdmin, TUTOR_ACTIONS }
