const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { AppError } = require('../errors')

// Parent and tutor sign-in by one-time code sent to their mobile number.
//
// Codes are stored hashed, expire after 10 minutes, allow 5 attempts, and can be re-sent after
// 30 seconds. No SMS provider is connected yet: codes are written to the server log, and are
// also returned in the API response when OTP_DEV_ECHO=true (local development only).
//
// Two kinds of token are issued, with different audiences so one cannot stand in for the other:
// - session tokens (role parent | tutor, subject = the parent or tutor id)
// - phone-verification tokens, proving a number was verified, used once to register

const ISSUER = 'home-tution-api'
const SESSION_AUDIENCE = 'home-tution-user'
const PHONE_AUDIENCE = 'home-tution-phone'
const ROLES = ['parent', 'tutor']
const CODE_TTL_MS = 10 * 60 * 1000
const RESEND_AFTER_MS = 30 * 1000
const MAX_ATTEMPTS = 5

let generatedSecret = null
function secret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) return process.env.JWT_SECRET
  if (process.env.NODE_ENV === 'production') {
    throw new AppError(503, 'AUTH_NOT_CONFIGURED', 'Sign-in is not configured')
  }
  // Development without a configured secret: a random one per process, so tokens do not
  // survive a restart but can never be forged with a known default.
  if (!generatedSecret) {
    generatedSecret = crypto.randomBytes(32).toString('hex')
    console.warn('JWT_SECRET is not set (or shorter than 32 characters); using a temporary secret. Sessions end when the server restarts.')
  }
  return generatedSecret
}

const hashCode = (key, code) => crypto.createHash('sha256').update(`${key}:${code}`).digest('hex')

function createAuthService({ now = () => Date.now(), log = console.log } = {}) {
  const codes = new Map()

  function keyFor(phone, role, purpose) {
    return `${purpose}:${role}:${phone}`
  }

  return {
    ROLES,

    // Issues a code. Returns { expiresInSeconds, devCode? }.
    sendCode(phone, role, purpose) {
      const key = keyFor(phone, role, purpose)
      const existing = codes.get(key)
      const t = now()
      if (existing && t - existing.sentAt < RESEND_AFTER_MS) {
        const wait = Math.ceil((RESEND_AFTER_MS - (t - existing.sentAt)) / 1000)
        throw new AppError(429, 'OTP_COOLDOWN', `Please wait ${wait} seconds before requesting another code`, { retryAfterSeconds: wait })
      }
      const code = String(crypto.randomInt(100000, 1000000))
      codes.set(key, { hash: hashCode(key, code), sentAt: t, expiresAt: t + CODE_TTL_MS, attempts: 0 })
      log(`[otp] ${purpose} code for ${role} ${phone}: ${code}`)
      const result = { expiresInSeconds: CODE_TTL_MS / 1000 }
      if (process.env.OTP_DEV_ECHO === 'true') result.devCode = code
      return result
    },

    // Checks a code. Throws on failure; the code is single-use.
    verifyCode(phone, role, purpose, code) {
      const key = keyFor(phone, role, purpose)
      const entry = codes.get(key)
      if (!entry || now() > entry.expiresAt) {
        codes.delete(key)
        throw new AppError(400, 'OTP_EXPIRED', 'The code has expired. Request a new one.')
      }
      if (entry.attempts >= MAX_ATTEMPTS) {
        codes.delete(key)
        throw new AppError(429, 'OTP_LOCKED', 'Too many incorrect attempts. Request a new code.')
      }
      const expected = Buffer.from(entry.hash, 'hex')
      const given = Buffer.from(hashCode(key, String(code)), 'hex')
      if (!crypto.timingSafeEqual(expected, given)) {
        entry.attempts += 1
        const left = MAX_ATTEMPTS - entry.attempts
        throw new AppError(400, 'OTP_INVALID', left > 0 ? `Incorrect code. ${left} attempt(s) left.` : 'Incorrect code. Request a new one.')
      }
      codes.delete(key)
    },

    issueSession(role, id) {
      return jwt.sign({ role }, secret(), { algorithm: 'HS256', issuer: ISSUER, audience: SESSION_AUDIENCE, subject: id, expiresIn: '7d', jwtid: crypto.randomUUID() })
    },

    verifySession(token) {
      const payload = jwt.verify(token, secret(), { algorithms: ['HS256'], issuer: ISSUER, audience: SESSION_AUDIENCE })
      if (!ROLES.includes(payload.role) || !payload.sub) throw new Error('bad session')
      return { role: payload.role, id: payload.sub }
    },

    issuePhoneToken(phone, role) {
      return jwt.sign({ phone, role }, secret(), { algorithm: 'HS256', issuer: ISSUER, audience: PHONE_AUDIENCE, expiresIn: '30m' })
    },

    // Throws an AppError unless the token proves `phone` was verified for `role`.
    verifyPhoneToken(token, phone, role) {
      let payload
      try {
        payload = jwt.verify(String(token || ''), secret(), { algorithms: ['HS256'], issuer: ISSUER, audience: PHONE_AUDIENCE })
      } catch {
        throw new AppError(401, 'PHONE_NOT_VERIFIED', 'Verify your mobile number before submitting')
      }
      if (payload.phone !== phone || payload.role !== role) {
        throw new AppError(401, 'PHONE_NOT_VERIFIED', 'The verified number does not match the number on the form')
      }
    },
  }
}

module.exports = { createAuthService, ROLES }
