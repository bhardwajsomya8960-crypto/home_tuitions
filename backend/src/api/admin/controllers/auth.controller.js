const { readAdminConfig } = require('../../../config/adminConfig')
const { verifyAdminCredentials, issueAdminToken } = require('../../../modules/auth/adminAuth.service')
const { FailureLimiter } = require('../../../shared/middleware/loginRateLimiter')

const GENERIC_FAILURE = { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }

// Staff sign-in with the single admin account configured on the server (no database lookup).
function createAuthController() {
  const limiter = new FailureLimiter()

  return {
    async login(req, res) {
      const cfg = readAdminConfig()
      if (!cfg.configured) {
        // Outside production, say what is missing so local setup problems are easy to fix.
        const body = { error: 'Admin access is not configured', code: 'ADMIN_NOT_CONFIGURED' }
        if (process.env.NODE_ENV !== 'production') body.details = cfg.problems.map(message => ({ field: 'server', message }))
        return res.status(503).json(body)
      }

      const { email, password } = req.body || {}
      if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length === 0 || password.length > 200) {
        return res.status(400).json({ error: 'Email and password are required', code: 'VALIDATION_FAILED' })
      }

      const accountKey = `account:${email.trim().toLowerCase()}`
      const ipKey = `ip:${req.ip}`
      const retry = Math.max(limiter.retryAfter(accountKey), limiter.retryAfter(ipKey))
      if (retry > 0) {
        res.set('Retry-After', String(retry))
        return res.status(429).json({ error: 'Too many failed attempts. Try again later.', code: 'RATE_LIMITED' })
      }

      if (!(await verifyAdminCredentials(cfg, email, password))) {
        limiter.recordFailure(accountKey)
        limiter.recordFailure(ipKey)
        return res.status(401).json(GENERIC_FAILURE)
      }

      limiter.reset(accountKey)
      return res.json({ token: issueAdminToken(cfg), tokenType: 'Bearer', expiresIn: cfg.ttl })
    },

    me: req => ({ id: req.admin.id, role: 'admin' }),
  }
}

module.exports = { createAuthController }
