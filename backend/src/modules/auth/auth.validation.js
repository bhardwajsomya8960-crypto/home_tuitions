// One-time code requests from the website sign-in and registration forms.
const otpSpec = {
  phone: { type: 'phone', required: true },
  role: { type: 'enum', required: true, allowed: ['parent', 'tutor'] },
  purpose: { type: 'enum', required: true, allowed: ['login', 'register'] },
}
const verifySpec = { ...otpSpec, code: { type: 'string', required: true, min: 6, max: 6 } }

module.exports = { otpSpec, verifySpec }
