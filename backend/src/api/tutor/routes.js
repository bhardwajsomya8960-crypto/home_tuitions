const express = require('express')
const { json, created, noContent } = require('../../shared/http')
const { asyncHandler } = require('../../shared/middleware/asyncHandler')
const { requireUser } = require('../../shared/middleware/requireUser')
const { singleUpload } = require('../../shared/middleware/upload')
const { MAX_UPLOAD_BYTES } = require('../../modules/tutors/tutorDocument.service')
const { createAccountController } = require('./controllers/account.controller')
const { createOverviewController } = require('./controllers/overview.controller')
const { createDocumentsController } = require('./controllers/documents.controller')
const { createOffersController } = require('./controllers/offers.controller')
const { createClassesController } = require('./controllers/classes.controller')

// Tutor portal API, mounted at /api/tutors. Registration is public (it needs a verified phone
// token); everything under /me requires a tutor session and is scoped to that tutor.
function createTutorRouter(deps) {
  const router = express.Router()
  const account = createAccountController(deps)
  const overview = createOverviewController(deps)
  const documents = createDocumentsController(deps)
  const offers = createOffersController(deps)
  const classes = createClassesController(deps)

  router.post('/register', created(account.register))

  router.use('/me', requireUser('tutor'))
  router.get('/me/overview', json(overview.overview))
  router.patch('/me', json(account.updateProfile))

  router.post('/me/documents', singleUpload('file', { maxBytes: MAX_UPLOAD_BYTES }), created(documents.upload))
  router.delete('/me/documents/:docId', noContent(documents.remove))
  router.get('/me/documents/:docId/file', asyncHandler(documents.file))

  router.post('/me/offers/:id/accept', json(offers.accept))
  router.post('/me/offers/:id/reject', json(offers.reject))
  router.post('/me/offers/:id/unavailable', json(offers.unavailable))
  router.post('/me/offers/:id/request-info', json(offers.requestInfo))

  router.post('/me/classes/:sessionId/attendance', json(classes.attendance))

  return router
}

module.exports = { createTutorRouter }
