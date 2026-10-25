const express = require('express')
const { asyncHandler } = require('../middleware/asyncHandler')
const { publicMasters } = require('../services/masters')

// Internal operations API. Mounted behind requireAdmin in app.js, so every route here needs a
// valid admin token. All writes are recorded in the audit log by the service layer.
function createAdminRouter({ operations }) {
  const router = express.Router()
  const { admin, people, assignments, delivery } = operations
  const ACTOR = 'admin'
  const json = fn => asyncHandler(async (req, res) => res.json(await fn(req)))
  const created = fn => asyncHandler(async (req, res) => res.status(201).json(await fn(req)))

  router.get('/dashboard', json(() => { assignments.expireOffers(); return admin.dashboard() }))
  router.get('/operations', json(() => { assignments.expireOffers(); return admin.operations() }))
  router.get('/masters', json(() => publicMasters()))

  // Leads (CRM)
  router.get('/leads', json(req => admin.listLeads(req.query)))
  router.post('/leads', created(async req => admin.leadDetail((await people.createStaffLead(req.body, ACTOR)).id)))
  router.get('/leads/:id', json(req => { assignments.expireOffers(); return admin.leadDetail(req.params.id) }))
  router.post('/leads/:id/status', json(req => admin.changeLeadStatus(req.params.id, req.body, ACTOR)))
  router.post('/leads/:id/notes', json(req => admin.addLeadNote(req.params.id, req.body?.note, ACTOR)))
  router.patch('/leads/:id/location', json(req => admin.updateLeadLocation(req.params.id, req.body, ACTOR)))

  // Matching and offers
  router.post('/leads/:id/match', json(req => { assignments.runMatching(req.params.id, ACTOR); return admin.leadDetail(req.params.id) }))
  router.post('/leads/:id/offers', json(req => {
    const tutorIds = req.body?.tutorIds
    if (tutorIds !== undefined && (!Array.isArray(tutorIds) || tutorIds.length === 0 || tutorIds.length > 10 || tutorIds.some(t => typeof t !== 'string'))) {
      throw operations.ctx.invalid([{ field: 'tutorIds', message: 'must be a list of 1 to 10 tutor ids' }])
    }
    assignments.offerNext(req.params.id, ACTOR, { tutorIds })
    return admin.leadDetail(req.params.id)
  }))
  router.get('/leads/:id/tutor-search', json(req => ({ items: assignments.searchTutorsForLead(req.params.id, req.query.q) })))
  router.post('/leads/:id/assign', json(req => { assignments.assignManually(req.params.id, req.body, ACTOR); return admin.leadDetail(req.params.id) }))
  router.post('/assignments/:id/confirm', json(req => admin.leadDetail(assignments.confirm(req.params.id, ACTOR).leadId)))
  router.post('/assignments/:id/release', json(req => admin.leadDetail(assignments.release(req.params.id, ACTOR, req.body?.note).leadId)))

  // Demos
  router.post('/leads/:id/demos', created(req => { delivery.scheduleDemo(req.params.id, req.body, ACTOR); return admin.leadDetail(req.params.id) }))
  router.post('/demos/:id/reschedule', json(req => admin.leadDetail(delivery.rescheduleDemo(req.params.id, req.body?.scheduledAt, ACTOR).leadId)))
  router.post('/demos/:id/complete', json(req => admin.leadDetail(delivery.completeDemo(req.params.id, req.body, ACTOR).leadId)))
  router.post('/demos/:id/outcome', json(req => admin.leadDetail(delivery.setOutcome(req.params.id, req.body?.outcome, ACTOR).leadId)))
  router.post('/demos/:id/no-show', json(req => admin.leadDetail(delivery.markNoShow(req.params.id, req.body?.party, ACTOR).leadId)))
  router.post('/demos/:id/cancel', json(req => admin.leadDetail(delivery.cancelDemo(req.params.id, ACTOR, req.body?.note).leadId)))

  // Conversion, enrolments, billing
  router.post('/leads/:id/convert', created(req => { delivery.convertLead(req.params.id, req.body, ACTOR); return admin.leadDetail(req.params.id) }))
  router.get('/enrolments', json(req => admin.listEnrolments(req.query)))
  router.post('/enrolments/:id/status', json(req => delivery.setEnrolmentStatus(req.params.id, req.body?.status, ACTOR)))
  router.get('/invoices', json(req => admin.listInvoices(req.query)))
  router.post('/invoices', created(req => delivery.invoiceView(delivery.createInvoice(req.body, ACTOR))))
  router.post('/invoices/:id/payments', created(req => delivery.invoiceView(delivery.recordPayment(req.params.id, req.body, ACTOR).invoice)))
  router.post('/invoices/:id/void', json(req => delivery.invoiceView(delivery.voidInvoice(req.params.id, ACTOR))))

  // Tutors and KYC
  router.get('/tutors', json(req => admin.listTutors(req.query)))
  router.get('/tutors/:id', json(req => admin.tutorDetail(req.params.id)))
  router.post('/tutors/:id/actions', json(req => admin.tutorAction(req.params.id, req.body, ACTOR)))
  router.post('/documents/:id/review', json(req => admin.reviewDocument(req.params.id, req.body, ACTOR)))
  router.get('/documents/:id/file', asyncHandler(async (req, res) => {
    const { doc, path } = people.documentFile(req.params.id)
    operations.ctx.audit(ACTOR, 'tutor.document.view', 'tutor', doc.tutorId, { documentId: doc.id })
    res.type(doc.mimeType).set('Cache-Control', 'no-store').sendFile(path)
  }))

  // Settings and audit
  router.get('/settings', json(() => admin.getSettings()))
  router.put('/settings', json(req => admin.updateSettings(req.body, ACTOR)))
  router.get('/audit', json(req => admin.listAudit(req.query)))

  return router
}

module.exports = { createAdminRouter }
