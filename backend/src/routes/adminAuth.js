const express = require('express')
const { readAdminConfig } = require('../config/adminConfig')
const { verifyAdminCredentials, issueAdminToken } = require('../services/adminAuthService')
const { FailureLimiter } = require('../middleware/loginRateLimiter')
const { requireAdmin } = require('../middleware/requireAdmin')

const router = express.Router()
const limiter = new FailureLimiter()

const GENERIC_FAILURE = { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }

router.post('/login', async (req, res, next) => {
  try {
    const cfg = readAdminConfig()
    if (!cfg.configured) {
      return res.status(503).json({ error: 'Admin access is not configured', code: 'ADMIN_NOT_CONFIGURED' })
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

    const ok = await verifyAdminCredentials(cfg, email, password)
    if (!ok) {
      limiter.recordFailure(accountKey)
      limiter.recordFailure(ipKey)
      return res.status(401).json(GENERIC_FAILURE)
    }

    limiter.reset(accountKey)
    return res.json({ token: issueAdminToken(cfg), tokenType: 'Bearer', expiresIn: cfg.ttl })
  } catch (err) {
    return next(err)
  }
})

router.get('/me', requireAdmin, (req, res) => {
  res.json({ id: req.admin.id, role: 'admin' })
})

module.exports = router
