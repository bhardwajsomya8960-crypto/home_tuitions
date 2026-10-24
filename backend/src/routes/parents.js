const express = require('express')
const { asyncHandler } = require('../middleware/asyncHandler')
const { requireUser } = require('../middleware/requireUser')

// Parent portal. Registration is public (it needs a verified phone token); everything under
// /me requires a parent session and only ever reads or changes that parent's own records.
function createParentsRouter({ authService, operations }) {
  const router = express.Router()
  const { people, portals, delivery, views } = operations

  router.post('/register', asyncHandler(async (req, res) => {
    const { parent, student, lead } = await people.registerParent(req.body, authService)
    res.status(201).json({
      token: authService.issueSession('parent', parent.id),
      parent: { id: parent.id, name: parent.name },
      student: { id: student.id, name: student.name },
      lead: views.parentLead(lead),
    })
  }))

  router.use('/me', requireUser('parent'))

  router.get('/me/overview', asyncHandler(async (req, res) => {
    res.json(portals.parentOverview(req.user.id))
  }))

  router.get('/me/classes', asyncHandler(async (req, res) => {
    res.json({ items: portals.parentClasses(req.user.id) })
  }))

  router.post('/me/students', asyncHandler(async (req, res) => {
    res.status(201).json(people.addStudent(req.user.id, req.body))
  }))

  router.post('/me/requests', asyncHandler(async (req, res) => {
    const lead = await people.createParentRequest(req.user.id, req.body)
    res.status(201).json(views.parentLead(lead))
  }))

  router.post('/me/requests/:leadId/cancel', asyncHandler(async (req, res) => {
    res.json(portals.cancelRequest(req.user.id, req.params.leadId, req.body?.reason))
  }))

  router.post('/me/requests/:leadId/review', asyncHandler(async (req, res) => {
    res.status(201).json(delivery.reviewTutor(req.user.id, req.params.leadId, req.body))
  }))

  router.post('/me/demos/:demoId/outcome', asyncHandler(async (req, res) => {
    res.json(portals.parentDemoOutcome(req.user.id, req.params.demoId, req.body?.outcome))
  }))

  router.post('/me/demos/:demoId/reschedule-request', asyncHandler(async (req, res) => {
    res.json(portals.parentRescheduleRequest(req.user.id, req.params.demoId, req.body?.message))
  }))

  router.post('/me/classes/:sessionId/acknowledge', asyncHandler(async (req, res) => {
    res.json(delivery.acknowledgeSession(req.params.sessionId, req.user.id))
  }))

  return router
}

module.exports = { createParentsRouter }
