const express = require('express')
const { asyncHandler } = require('../middleware/asyncHandler')
const { requireUser } = require('../middleware/requireUser')
const { validateFields } = require('../services/validation')
const { AppError } = require('../errors')

// Parent and tutor sign-in and phone verification by one-time code.
//
//   POST /send-otp    { phone, role: parent|tutor, purpose: login|register }
//   POST /verify-otp  { phone, role, purpose, code }
//        login    -> { token, role, user }
//        register -> { phoneToken }  (sent with the registration form)
//   GET  /me         current session
//
// Admin access is never granted here; it comes only from /api/admin/auth/login.
const otpSpec = {
  phone: { type: 'phone', required: true },
  role: { type: 'enum', required: true, allowed: ['parent', 'tutor'] },
  purpose: { type: 'enum', required: true, allowed: ['login', 'register'] },
}
const verifySpec = { ...otpSpec, code: { type: 'string', required: true, min: 6, max: 6 } }

function validated(body, spec) {
  const { value, errors } = validateFields(body, spec)
  if (errors.length) throw new AppError(400, 'VALIDATION_FAILED', 'Some fields are invalid', errors)
  return value
}

function createAuthRouter({ authService, operations }) {
  const router = express.Router()
  const { repo } = operations.ctx
  const accountFor = (role, phone) => repo.findOne(role === 'parent' ? 'parents' : 'tutors', { phone })

  router.post('/send-otp', asyncHandler(async (req, res) => {
    const v = validated(req.body, otpSpec)
    const account = accountFor(v.role, v.phone)
    if (v.purpose === 'login' && !account) {
      throw new AppError(404, 'NO_ACCOUNT', v.role === 'parent' ? 'No account uses this number. Start a new enquiry instead.' : 'No tutor account uses this number. Register first.')
    }
    if (v.purpose === 'register' && account) {
      throw new AppError(409, 'ALREADY_REGISTERED', 'An account already uses this number. Sign in instead.')
    }
    res.json({ sent: true, ...authService.sendCode(v.phone, v.role, v.purpose) })
  }))

  router.post('/verify-otp', asyncHandler(async (req, res) => {
    const v = validated(req.body, verifySpec)
    authService.verifyCode(v.phone, v.role, v.purpose, v.code)
    if (v.purpose === 'register') return res.json({ phoneToken: authService.issuePhoneToken(v.phone, v.role) })
    const account = accountFor(v.role, v.phone)
    if (!account) throw new AppError(404, 'NO_ACCOUNT', 'No account uses this number')
    return res.json({ token: authService.issueSession(v.role, account.id), role: v.role, user: { id: account.id, name: account.name } })
  }))

  const me = role => [requireUser(role), (req, res) => {
    const account = repo.get(role === 'parent' ? 'parents' : 'tutors', req.user.id)
    if (!account) return res.status(401).json({ error: 'Account not found', code: 'UNAUTHENTICATED' })
    return res.json({ role, id: account.id, name: account.name })
  }]
  router.get('/me/parent', ...me('parent'))
  router.get('/me/tutor', ...me('tutor'))

  return router
}

module.exports = { createAuthRouter }
