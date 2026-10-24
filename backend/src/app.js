const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { AppError } = require('./errors')
const { requireAdmin } = require('./middleware/requireAdmin')
const { createCatalogueService } = require('./services/catalogueService')
const { createCatalogueRepository } = require('./repositories/catalogueRepository')
const { createOperationsRepository } = require('./repositories/operationsRepository')
const { createOperationsService } = require('./services/operations')
const { createAuthService } = require('./services/authService')

// Browsers may call the API only from the configured frontend origins (comma-separated
// CORS_ORIGINS). Without it, any origin is allowed, which suits local development only.
function corsOptions() {
  const origins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)
  return origins.length ? { origin: origins } : {}
}

// Builds the Express app. Dependencies can be injected (tests use an in-memory database).
// Pass `db` to share one database between the catalogue and operations services.
function createApp({ catalogueService, operationsService, authService, db } = {}) {
  const app = express()
  let service = catalogueService
  if (!service || !operationsService) {
    // Required lazily so importing this module does not open a database.
    const database = db || require('./config/database').getDatabase()
    if (!service) service = createCatalogueService({ repo: createCatalogueRepository(database) })
    if (!operationsService) operationsService = createOperationsService({ repo: createOperationsRepository(database), catalogueService: service })
  }
  const auth = authService || createAuthService()
  app.locals.catalogueService = service
  app.locals.operationsService = operationsService
  app.locals.authService = auth
  const deps = { authService: auth, operations: operationsService }

  app.use(helmet())
  app.use(cors(corsOptions()))
  app.use(express.json({ limit: '100kb' }))

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'home-tution-api' })
  })

  app.use('/api/masters', require('./routes/masters'))
  app.use('/api/auth', require('./routes/auth').createAuthRouter(deps))
  app.use('/api/parents', require('./routes/parents').createParentsRouter(deps))
  app.use('/api/tutors', require('./routes/tutors').createTutorsRouter(deps))

  // Public catalogue (published content only)
  app.use('/api/catalogue', require('./routes/catalogue').createCataloguePublicRouter(service))

  // Admin login is the only public route under /api/admin
  app.use('/api/admin/auth', require('./routes/adminAuth'))

  // Every other /api/admin route requires a valid admin token
  app.use('/api/admin/catalogue', requireAdmin, require('./routes/catalogueAdmin').createCatalogueAdminRouter(service))
  app.use('/api/admin', requireAdmin, require('./routes/admin').createAdminRouter(deps))

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
