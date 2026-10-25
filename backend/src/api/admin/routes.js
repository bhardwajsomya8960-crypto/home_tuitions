const express = require('express')
const { json, created } = require('../../shared/http')
const { asyncHandler } = require('../../shared/middleware/asyncHandler')
const { singleUpload } = require('../../shared/middleware/upload')
const { MAX_UPLOAD_BYTES } = require('../../modules/tutors/tutorDocument.service')
const { requireAdmin } = require('../../shared/middleware/requireAdmin')
const { createAuthController } = require('./controllers/auth.controller')
const { createDashboardController } = require('./controllers/dashboard.controller')
const { createLeadsController } = require('./controllers/leads.controller')
const { createMatchingController } = require('./controllers/matching.controller')
const { createDemosController } = require('./controllers/demos.controller')
const { createEnrolmentsController } = require('./controllers/enrolments.controller')
const { createBillingController } = require('./controllers/billing.controller')
const { createTutorsController } = require('./controllers/tutors.controller')
const { createSettingsController } = require('./controllers/settings.controller')
const { createAuditController } = require('./controllers/audit.controller')
const { createCatalogueController } = require('./controllers/catalogue.controller')
const { createEnquiriesController } = require('./controllers/enquiries.controller')
const { createParentsController } = require('./controllers/parents.controller')

const LIFECYCLE_ACTIONS = ['publish', 'unpublish', 'archive', 'restore']

// Staff (operations) API, mounted at /api/admin. Only /auth/login is public; every other route
// checks the signed admin token. All writes are recorded in the audit log by the services.
function createAdminRouter(deps) {
  const router = express.Router()
  const auth = createAuthController(deps)
  const dashboard = createDashboardController(deps)
  const leads = createLeadsController(deps)
  const matching = createMatchingController(deps)
  const demos = createDemosController(deps)
  const enrolments = createEnrolmentsController(deps)
  const billing = createBillingController(deps)
  const tutors = createTutorsController(deps)
  const settings = createSettingsController(deps)
  const audit = createAuditController(deps)
  const catalogue = createCatalogueController(deps)
  const enquiries = createEnquiriesController(deps)
  const parents = createParentsController(deps)

  router.post('/auth/login', asyncHandler(auth.login))
  router.use(requireAdmin)
  router.get('/auth/me', json(auth.me))

  router.get('/dashboard', json(dashboard.dashboard))
  router.get('/operations', json(dashboard.operations))
  router.get('/masters', json(dashboard.masters))

  // Website callback requests
  router.get('/enquiries', json(enquiries.list))
  router.post('/enquiries', created(enquiries.create))
  router.get('/enquiries/:id', json(enquiries.detail))
  router.patch('/enquiries/:id', json(enquiries.update))

  // Parents and students (accounts created by staff, or from the website)
  router.get('/parents', json(parents.list))
  router.post('/parents', created(parents.create))
  router.get('/parents/:id', json(parents.detail))
  router.patch('/parents/:id', json(parents.update))
  router.post('/parents/:id/students', created(parents.addStudent))
  router.post('/parents/:id/leads', created(parents.createRequest))

  // Leads
  router.get('/leads', json(leads.list))
  router.post('/leads', created(leads.create))
  router.get('/leads/:id', json(leads.detail))
  router.post('/leads/:id/status', json(leads.changeStatus))
  router.post('/leads/:id/notes', json(leads.addNote))
  router.patch('/leads/:id/location', json(leads.updateLocation))

  // Matching and offers
  router.post('/leads/:id/match', json(matching.runMatching))
  router.post('/leads/:id/offers', json(matching.sendOffers))
  router.get('/leads/:id/tutor-search', json(matching.searchTutors))
  router.post('/leads/:id/assign', json(matching.assign))
  router.post('/assignments/:id/confirm', json(matching.confirm))
  router.post('/assignments/:id/release', json(matching.release))

  // Demos
  router.post('/leads/:id/demos', created(demos.schedule))
  router.post('/demos/:id/reschedule', json(demos.reschedule))
  router.post('/demos/:id/complete', json(demos.complete))
  router.post('/demos/:id/outcome', json(demos.outcome))
  router.post('/demos/:id/no-show', json(demos.noShow))
  router.post('/demos/:id/cancel', json(demos.cancel))

  // Conversion, enrolments, billing
  router.post('/leads/:id/convert', created(enrolments.convert))
  router.get('/enrolments', json(enrolments.list))
  router.post('/enrolments/:id/status', json(enrolments.setStatus))
  router.get('/invoices', json(billing.list))
  router.post('/invoices', created(billing.create))
  router.post('/invoices/:id/payments', created(billing.recordPayment))
  router.post('/invoices/:id/void', json(billing.void))

  // Tutors and KYC
  router.get('/tutors', json(tutors.list))
  router.post('/tutors', created(tutors.create))
  router.post('/tutors/:id/documents', singleUpload('file', { maxBytes: MAX_UPLOAD_BYTES }), created(tutors.uploadDocument))
  router.get('/tutors/:id', json(tutors.detail))
  router.post('/tutors/:id/actions', json(tutors.action))
  router.post('/documents/:id/review', json(tutors.reviewDocument))
  router.get('/documents/:id/file', asyncHandler(tutors.file))

  // Settings and audit
  router.get('/settings', json(settings.get))
  router.put('/settings', json(settings.update))
  router.get('/audit', json(audit.list))

  // Catalogue
  router.get('/catalogue/categories', json(catalogue.listCategories))
  router.post('/catalogue/categories', created(catalogue.createCategory))
  router.get('/catalogue/categories/:id', json(catalogue.getCategory))
  router.patch('/catalogue/categories/:id', json(catalogue.updateCategory))
  router.get('/catalogue/courses', json(catalogue.listCourses))
  router.post('/catalogue/courses', created(catalogue.createCourse))
  router.get('/catalogue/courses/:id', json(catalogue.getCourse))
  router.patch('/catalogue/courses/:id', json(catalogue.updateCourse))
  for (const action of LIFECYCLE_ACTIONS) {
    router.post(`/catalogue/categories/:id/${action}`, json(catalogue.transition('category', action)))
    router.post(`/catalogue/courses/:id/${action}`, json(catalogue.transition('course', action)))
  }

  return router
}

module.exports = { createAdminRouter }
