const express = require('express')
const { json, created } = require('../../shared/http')
const { rateLimit } = require('../../shared/middleware/rateLimit')
const { requireUser } = require('../../shared/middleware/requireUser')
const { createMastersController } = require('./controllers/masters.controller')
const { createCatalogueController } = require('./controllers/catalogue.controller')
const { createAuthController } = require('./controllers/auth.controller')
const { createEnquiriesController } = require('./controllers/enquiries.controller')

// Public website API: form master data, the course catalogue, the callback form and phone
// sign-in. Mounted at /api (see app.js), so paths are /api/masters, /api/enquiries, /api/auth/...
function createWebsiteRouter(deps) {
  const router = express.Router()
  const masters = createMastersController(deps)
  const catalogue = createCatalogueController(deps)
  const auth = createAuthController(deps)
  const enquiries = createEnquiriesController(deps)
  // Per connection per hour; ENQUIRY_RATE_LIMIT can change it (tests use a small number).
  const enquiryLimit = rateLimit({ max: Number(process.env.ENQUIRY_RATE_LIMIT) || 10, windowMs: 60 * 60 * 1000, message: 'Too many requests from this connection. Please call or WhatsApp us instead.' })

  router.get('/masters', json(masters.list))

  router.get('/catalogue/categories', json(catalogue.listCategories))
  router.get('/catalogue/categories/:slug', json(catalogue.getCategory))
  router.get('/catalogue/courses', json(catalogue.listCourses))
  router.get('/catalogue/courses/:slug', json(catalogue.getCourse))

  router.post('/enquiries', enquiryLimit, created(enquiries.submit))

  router.post('/auth/send-otp', json(auth.sendOtp))
  router.post('/auth/verify-otp', json(auth.verifyOtp))
  router.get('/auth/me/parent', requireUser('parent'), json(auth.me('parent')))
  router.get('/auth/me/tutor', requireUser('tutor'), json(auth.me('tutor')))

  return router
}

module.exports = { createWebsiteRouter }
