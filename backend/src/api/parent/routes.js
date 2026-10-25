const express = require('express')
const { json, created } = require('../../shared/http')
const { requireUser } = require('../../shared/middleware/requireUser')
const { createAccountController } = require('./controllers/account.controller')
const { createOverviewController } = require('./controllers/overview.controller')
const { createRequestsController } = require('./controllers/requests.controller')
const { createStudentsController } = require('./controllers/students.controller')
const { createDemosController } = require('./controllers/demos.controller')
const { createClassesController } = require('./controllers/classes.controller')

// Parent portal API, mounted at /api/parents. Registration is public (it needs a verified phone
// token); everything under /me requires a parent session and only touches that parent's records.
function createParentRouter(deps) {
  const router = express.Router()
  const account = createAccountController(deps)
  const overview = createOverviewController(deps)
  const requests = createRequestsController(deps)
  const students = createStudentsController(deps)
  const demos = createDemosController(deps)
  const classes = createClassesController(deps)

  router.post('/register', created(account.register))

  router.use('/me', requireUser('parent'))
  router.get('/me/overview', json(overview.overview))
  router.get('/me/classes', json(overview.classes))
  router.post('/me/classes/:sessionId/acknowledge', json(classes.acknowledge))
  router.post('/me/students', created(students.add))
  router.post('/me/requests', created(requests.create))
  router.post('/me/requests/:leadId/cancel', json(requests.cancel))
  router.post('/me/requests/:leadId/review', created(requests.review))
  router.post('/me/demos/:demoId/outcome', json(demos.outcome))
  router.post('/me/demos/:demoId/reschedule-request', json(demos.rescheduleRequest))

  return router
}

module.exports = { createParentRouter }
