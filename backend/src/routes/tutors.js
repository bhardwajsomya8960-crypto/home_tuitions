const express = require('express')
const multer = require('multer')
const { asyncHandler } = require('../middleware/asyncHandler')
const { requireUser } = require('../middleware/requireUser')
const { MAX_UPLOAD_BYTES } = require('../services/operations/people')
const { AppError } = require('../errors')

// Tutor portal. Registration is public (it needs a verified phone token); everything under
// /me requires a tutor session and is scoped to that tutor.
function createTutorsRouter({ authService, operations }) {
  const router = express.Router()
  const { people, portals, assignments, delivery, views } = operations
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 2 } })

  router.post('/register', asyncHandler(async (req, res) => {
    const tutor = await people.registerTutor(req.body, authService)
    res.status(201).json({ token: authService.issueSession('tutor', tutor.id), tutor: { id: tutor.id, name: tutor.name, status: tutor.status } })
  }))

  router.use('/me', requireUser('tutor'))

  router.get('/me/overview', asyncHandler(async (req, res) => {
    res.json(portals.tutorOverview(req.user.id))
  }))

  router.patch('/me', asyncHandler(async (req, res) => {
    res.json(people.updateTutor(req.user.id, req.body))
  }))

  router.post('/me/documents', (req, res, next) => {
    upload.single('file')(req, res, err => {
      if (err && err.code === 'LIMIT_FILE_SIZE') return next(new AppError(413, 'FILE_TOO_LARGE', 'Files must be 5 MB or smaller'))
      if (err) return next(new AppError(400, 'UPLOAD_FAILED', 'The upload could not be read'))
      return next()
    })
  }, asyncHandler(async (req, res) => {
    res.status(201).json(people.uploadDocument(req.user.id, req.body?.type, req.file))
  }))

  router.get('/me/documents/:docId/file', asyncHandler(async (req, res) => {
    const { doc, path } = people.documentFile(req.params.docId)
    if (doc.tutorId !== req.user.id) throw new AppError(404, 'NOT_FOUND', 'Document not found')
    res.type(doc.mimeType).set('Cache-Control', 'no-store').sendFile(path)
  }))

  router.post('/me/offers/:id/accept', asyncHandler(async (req, res) => {
    res.json(views.tutorOffer(assignments.accept(req.params.id, req.user.id)))
  }))

  router.post('/me/offers/:id/reject', asyncHandler(async (req, res) => {
    res.json(views.tutorOffer(assignments.decline(req.params.id, req.user.id, req.body)))
  }))

  router.post('/me/offers/:id/unavailable', asyncHandler(async (req, res) => {
    res.json(views.tutorOffer(assignments.decline(req.params.id, req.user.id, req.body, { unavailable: true })))
  }))

  router.post('/me/offers/:id/request-info', asyncHandler(async (req, res) => {
    res.json(views.tutorOffer(assignments.requestInfo(req.params.id, req.user.id, req.body?.message)))
  }))

  router.post('/me/classes/:sessionId/attendance', asyncHandler(async (req, res) => {
    res.json(delivery.recordAttendance(req.params.sessionId, req.user.id, req.body))
  }))

  return router
}

module.exports = { createTutorsRouter }
