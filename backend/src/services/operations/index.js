const path = require('path')
const { createContext } = require('./context')
const { createPeople } = require('./people')
const { createAssignments } = require('./assignments')
const { createDelivery } = require('./delivery')
const { createViews } = require('./views')
const { createAdmin } = require('./admin')
const { createPortals } = require('./portals')

const DEFAULT_UPLOADS = path.join(__dirname, '..', '..', '..', 'data', 'uploads')

// Operations service: everything from enquiry to enrolment and billing (blueprint §25).
// Dependencies are injected so tests can use an in-memory database and a fixed clock.
function createOperationsService({ repo, catalogueService, geo = require('../geoService'), uploadsDir = process.env.UPLOADS_DIR || DEFAULT_UPLOADS, now, newId }) {
  const ctx = createContext({ repo, now, newId })
  const views = createViews(ctx)
  const people = createPeople(ctx, { geo, catalogueService, uploadsDir })
  const assignments = createAssignments(ctx)
  const delivery = createDelivery(ctx, { assignments })
  const admin = createAdmin(ctx, { views, people, delivery })
  const portals = createPortals(ctx, { views, people, assignments, delivery })
  return { ctx, views, people, assignments, delivery, admin, portals }
}

module.exports = { createOperationsService }
