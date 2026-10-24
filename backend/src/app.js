const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { AppError } = require('./errors')
const { requireAdmin } = require('./middleware/requireAdmin')
const { createCatalogueService } = require('./services/catalogueService')
const { createCatalogueRepository } = require('./repositories/catalogueRepository')

// Builds the Express app. Dependencies can be injected (tests use an in-memory database).
function createApp({ catalogueService } = {}) {
  const app = express()
  let service = catalogueService
  if (!service) {
    // Required lazily so importing this module does not open a database.
    const { getDatabase } = require('./config/database')
    service = createCatalogueService({ repo: createCatalogueRepository(getDatabase()) })
  }
  app.locals.catalogueService = service

  app.use(helmet())
  app.use(cors())
  app.use(express.json({ limit: '100kb' }))

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'home-tution-api' })
  })

  app.use('/api/auth', require('./routes/auth'))
  app.use('/api/leads', require('./routes/leads'))
  app.use('/api/tutors', require('./routes/tutors'))
  app.use('/api/parents', require('./routes/parents'))

  // Public catalogue (published content only)
  app.use('/api/catalogue', require('./routes/catalogue').createCataloguePublicRouter(service))

  // Admin login is the only public route under /api/admin
  app.use('/api/admin/auth', require('./routes/adminAuth'))

  // Every other /api/admin route requires a valid admin token
  app.use('/api/admin/catalogue', requireAdmin, require('./routes/catalogueAdmin').createCatalogueAdminRouter(service))
  app.use('/api/admin', requireAdmin, require('./routes/admin'))

  app.use('/api/demos', require('./routes/demos'))
  app.use('/api/enrolments', require('./routes/enrolments'))
  app.use('/api/classes', require('./routes/classes'))
  app.use('/api/payments', require('./routes/payments'))

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' })
  })

  // Error handler: stable JSON shape, no stack traces or internal messages to clients
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body must be valid JSON', code: 'INVALID_JSON' })
    }
    if (err instanceof AppError) {
      const body = { error: err.message, code: err.code }
      if (err.details) body.details = err.details
      return res.status(err.status).json(body)
    }
    console.error(err)
    return res.status(500).json({ error: 'Something went wrong', code: 'INTERNAL' })
  })

  return app
}

module.exports = { createApp }
