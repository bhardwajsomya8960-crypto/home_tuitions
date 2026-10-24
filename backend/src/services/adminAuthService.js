const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

// Admin tokens are separate from parent/tutor tokens: different secret (ADMIN_JWT_SECRET),
// different audience, and role 'admin' is only ever issued here.
const ISSUER = 'home-tution-api'
const AUDIENCE = 'home-tution-admin'

let dummyHash = null
function getDummyHash() {
  // Used when the email does not match, so the response time does not reveal which part was wrong.
  if (!dummyHash) dummyHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10)
  return dummyHash
}

async function verifyAdminCredentials(cfg, email, password) {
  const emailMatches = typeof email === 'string' && email.trim().toLowerCase() === cfg.email
  const hash = emailMatches ? cfg.passwordHash : getDummyHash()
  const passwordMatches = await bcrypt.compare(String(password), hash)
  return emailMatches && passwordMatches
}

function issueAdminToken(cfg) {
  return jwt.sign({ sub: 'admin', role: 'admin' }, cfg.secret, {
    algorithm: 'HS256',
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: cfg.ttl,
    jwtid: crypto.randomUUID(),
  })
}

// Throws if the token is invalid, expired, or was not issued for the admin audience.
function verifyAdminToken(cfg, token) {
  return jwt.verify(token, cfg.secret, {
    algorithms: ['HS256'],
    issuer: ISSUER,
    audience: AUDIENCE,
  })
}

module.exports = { verifyAdminCredentials, issueAdminToken, verifyAdminToken }
