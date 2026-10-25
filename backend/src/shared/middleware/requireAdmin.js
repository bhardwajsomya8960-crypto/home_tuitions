const { readAdminConfig } = require('../../config/adminConfig')
const { verifyAdminToken } = require('../../modules/auth/adminAuth.service')

// Applied to every /api/admin route in the app (see app.js). Checks the signed admin token
// on each request. Hiding routes or buttons in the frontend is not a substitute for this.
function requireAdmin(req, res, next) {
  const cfg = readAdminConfig()
  if (!cfg.configured) {
    return res.status(503).json({ error: 'Admin access is not configured', code: 'ADMIN_NOT_CONFIGURED' })
  }

  const match = /^Bearer\s+(\S+)$/.exec(req.headers.authorization || '')
  if (!match) {
    return res.status(401).json({ error: 'Admin sign-in required', code: 'UNAUTHENTICATED' })
  }

  let payload
  try {
    payload = verifyAdminToken(cfg, match[1])
  } catch {
    return res.status(401).json({ error: 'Admin session is invalid or has expired', code: 'UNAUTHENTICATED' })
  }

  if (payload.role !== 'admin' || payload.sub !== 'admin') {
    return res.status(403).json({ error: 'Admin access required', code: 'FORBIDDEN' })
  }

  req.admin = { id: payload.sub }
  return next()
}

module.exports = { requireAdmin }
