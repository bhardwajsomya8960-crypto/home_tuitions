const { AppError } = require('../../../shared/errors')
const { validateFields } = require('../../../shared/validation')
const { otpSpec, verifySpec } = require('../../../modules/auth/auth.validation')

// Parent and tutor sign-in and phone verification by one-time code.
//   POST /send-otp    { phone, role: parent|tutor, purpose: login|register }
//   POST /verify-otp  { phone, role, purpose, code }
//        login    -> { token, role, user }
//        register -> { phoneToken }  (sent with the registration form)
// Admin access is never granted here; it comes only from /api/admin/auth/login.
function validated(body, spec) {
  const { value, errors } = validateFields(body, spec)
  if (errors.length) throw new AppError(400, 'VALIDATION_FAILED', 'Some fields are invalid', errors)
  return value
}

function createAuthController({ services, authService }) {
  const { repo } = services.ctx
  const accountFor = (role, phone) => repo.findOne(role === 'parent' ? 'Parent' : 'Tutor', { phone })

  return {
    async sendOtp(req) {
      const v = validated(req.body, otpSpec)
      const account = await accountFor(v.role, v.phone)
      if (v.purpose === 'login' && !account) {
        throw new AppError(404, 'NO_ACCOUNT', v.role === 'parent' ? 'No account uses this number. Start a new enquiry instead.' : 'No tutor account uses this number. Register first.')
      }
      if (v.purpose === 'register' && account) {
        throw new AppError(409, 'ALREADY_REGISTERED', 'An account already uses this number. Sign in instead.')
      }
      return { sent: true, ...authService.sendCode(v.phone, v.role, v.purpose) }
    },

    async verifyOtp(req) {
      const v = validated(req.body, verifySpec)
      authService.verifyCode(v.phone, v.role, v.purpose, v.code)
      if (v.purpose === 'register') return { phoneToken: authService.issuePhoneToken(v.phone, v.role) }
      const account = await accountFor(v.role, v.phone)
      if (!account) throw new AppError(404, 'NO_ACCOUNT', 'No account uses this number')
      return { token: authService.issueSession(v.role, account.id), role: v.role, user: { id: account.id, name: account.name } }
    },

    me: role => async req => {
      const account = await repo.get(role === 'parent' ? 'Parent' : 'Tutor', req.user.id)
      if (!account) throw new AppError(401, 'UNAUTHENTICATED', 'Account not found')
      return { role, id: account.id, name: account.name }
    },
  }
}

module.exports = { createAuthController }
