const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const mongoose = require('mongoose')
const { createServices } = require('./modules')
const { createAuthService } = require('./modules/auth/otp.service')
const { createWebsiteRouter } = require('./api/website/routes')
const { createParentRouter } = require('./api/parent/routes')
const { createTutorRouter } = require('./api/tutor/routes')
const { createAdminRouter } = require('./api/admin/routes')
const { errorHandler, notFound } = require('./shared/middleware/errorHandler')

// Browsers may call the API only from the configured frontend origins (comma-separated
// CORS_ORIGINS). Without it, any origin is allowed, which suits local development only.
function corsOptions() {
  const origins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)
  return origins.length ? { origin: origins } : {}
}

// Builds the Express app. The database must already be connected (see server.js). Tests pass
// their own services (fixed clock, temporary storage).
//
//   /api/masters, /api/catalogue, /api/auth   website (public)
//   /api/parents                              parent portal
//   /api/tutors                               tutor portal
//   /api/admin                                staff console
function createApp({ services = createServices(), authService = createAuthService() } = {}) {
  const app = express()
  app.locals.services = services
  app.locals.authService = authService
  const deps = { services, authService }

  // Behind a load balancer or nginx, trust the first proxy so req.ip is the client address.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY)
  app.use(helmet())
  app.use(cors(corsOptions()))
  app.use(express.json({ limit: '100kb' }))

  app.get('/health', (req, res) => {
    const db = mongoose.connection.readyState === 1 ? 'up' : 'down'
    res.status(db === 'up' ? 200 : 503).json({ status: db === 'up' ? 'ok' : 'degraded', db, service: 'home-online-tutor-hub-api' })
  })

  app.use('/api', createWebsiteRouter(deps))
  app.use('/api/parents', createParentRouter(deps))
  app.use('/api/tutors', createTutorRouter(deps))
  app.use('/api/admin', createAdminRouter(deps))

  app.use(notFound)
  app.use(errorHandler)
  return app
}

module.exports = { createApp }
