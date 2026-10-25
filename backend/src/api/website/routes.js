const express = require('express')
const { json } = require('../../shared/http')
const { requireUser } = require('../../shared/middleware/requireUser')
const { createMastersController } = require('./controllers/masters.controller')
const { createCatalogueController } = require('./controllers/catalogue.controller')
const { createAuthController } = require('./controllers/auth.controller')

// Public website API: form master data, the course catalogue and phone sign-in.
// Mounted at /api (see app.js), so paths here are /api/masters, /api/catalogue/..., /api/auth/...
function createWebsiteRouter(deps) {
  const router = express.Router()
  const masters = createMastersController(deps)
  const catalogue = createCatalogueController(deps)
  const auth = createAuthController(deps)

  router.get('/masters', json(masters.list))

  router.get('/catalogue/categories', json(catalogue.listCategories))
  router.get('/catalogue/categories/:slug', json(catalogue.getCategory))
  router.get('/catalogue/courses', json(catalogue.listCourses))
  router.get('/catalogue/courses/:slug', json(catalogue.getCourse))

  router.post('/auth/send-otp', json(auth.sendOtp))
  router.post('/auth/verify-otp', json(auth.verifyOtp))
  router.get('/auth/me/parent', requireUser('parent'), json(auth.me('parent')))
  router.get('/auth/me/tutor', requireUser('tutor'), json(auth.me('tutor')))

  return router
}

module.exports = { createWebsiteRouter }
