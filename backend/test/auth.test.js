const { test, before, after, describe } = require('node:test')
const assert = require('node:assert/strict')
const { configureAdminEnv, startTestServer, verifiedPhone, nextPhone, registerParent, parentBody } = require('./helpers')

configureAdminEnv()
const { createAuthService } = require('../src/modules/auth/otp.service')

let server
before(async () => { server = await startTestServer('auth') })
after(async () => { if (server) await server.close() })

describe('one-time codes', () => {
  test('codes are single use, expire, and lock after five wrong attempts', () => {
    let t = 0
    const auth = createAuthService({ now: () => t, log: () => {} })
    const { devCode } = auth.sendCode('9876543210', 'parent', 'login')
    auth.verifyCode('9876543210', 'parent', 'login', devCode)
    assert.throws(() => auth.verifyCode('9876543210', 'parent', 'login', devCode), { code: 'OTP_EXPIRED' })

    t += 31_000
    auth.sendCode('9876543210', 'parent', 'login')
    for (let i = 0; i < 5; i++) assert.throws(() => auth.verifyCode('9876543210', 'parent', 'login', '000000'), { code: 'OTP_INVALID' })
    assert.throws(() => auth.verifyCode('9876543210', 'parent', 'login', '000000'), { code: 'OTP_LOCKED' })

    t += 31_000
    const again = auth.sendCode('9876543210', 'parent', 'login')
    t += 11 * 60_000
    assert.throws(() => auth.verifyCode('9876543210', 'parent', 'login', again.devCode), { code: 'OTP_EXPIRED' })
  })

  test('a new code cannot be requested within 30 seconds', () => {
    let t = 0
    const auth = createAuthService({ now: () => t, log: () => {} })
    auth.sendCode('9876543211', 'tutor', 'register')
    assert.throws(() => auth.sendCode('9876543211', 'tutor', 'register'), { code: 'OTP_COOLDOWN' })
    t += 30_000
    assert.doesNotThrow(() => auth.sendCode('9876543211', 'tutor', 'register'))
  })

  test('codes are only returned in responses when OTP_DEV_ECHO=true', () => {
    const saved = process.env.OTP_DEV_ECHO
    process.env.OTP_DEV_ECHO = 'false'
    try {
      const auth = createAuthService({ log: () => {} })
      assert.equal(auth.sendCode('9876543212', 'parent', 'login').devCode, undefined)
    } finally {
      process.env.OTP_DEV_ECHO = saved
    }
  })
})

describe('sign-in and registration', () => {
  test('sign-in needs an existing account; registration needs a new number', async () => {
    const phone = nextPhone()
    const login = await server.request('POST', '/api/auth/send-otp', { body: { phone, role: 'parent', purpose: 'login' } })
    assert.equal(login.status, 404)
    assert.equal(login.body.code, 'NO_ACCOUNT')

    await registerParent(server, { phone })
    const again = await server.request('POST', '/api/auth/send-otp', { body: { phone, role: 'parent', purpose: 'register' } })
    assert.equal(again.status, 409)
  })

  test('a registered parent can sign in with a code and read only their own data', async () => {
    const { phone } = await registerParent(server)
    const sent = await server.request('POST', '/api/auth/send-otp', { body: { phone, role: 'parent', purpose: 'login' } })
    const verified = await server.request('POST', '/api/auth/verify-otp', { body: { phone, role: 'parent', purpose: 'login', code: sent.body.devCode } })
    assert.equal(verified.status, 200)
    const overview = await server.request('GET', '/api/parents/me/overview', { token: verified.body.token })
    assert.equal(overview.status, 200)
    assert.equal(overview.body.parent.phone, phone)
    assert.equal(overview.body.requests.length, 1)
  })

  test('registration refuses a missing, wrong or mismatched phone token', async () => {
    const phone = nextPhone()
    const none = await server.request('POST', '/api/parents/register', { body: parentBody({ phone, phoneToken: 'nope' }) })
    assert.equal(none.status, 401)
    assert.equal(none.body.code, 'PHONE_NOT_VERIFIED')

    const tokenForOther = await verifiedPhone(server, nextPhone(), 'parent')
    const mismatch = await server.request('POST', '/api/parents/register', { body: parentBody({ phone, phoneToken: tokenForOther }) })
    assert.equal(mismatch.status, 401)

    const tutorToken = await verifiedPhone(server, phone, 'tutor')
    const wrongRole = await server.request('POST', '/api/parents/register', { body: parentBody({ phone, phoneToken: tutorToken }) })
    assert.equal(wrongRole.status, 401)
  })

  test('a phone token is not a session token', async () => {
    const phoneToken = await verifiedPhone(server, nextPhone(), 'parent')
    const res = await server.request('GET', '/api/parents/me/overview', { token: phoneToken })
    assert.equal(res.status, 401)
  })

  test('consent to terms and communication is required', async () => {
    const phone = nextPhone()
    const phoneToken = await verifiedPhone(server, phone, 'parent')
    const res = await server.request('POST', '/api/parents/register', { body: parentBody({ phone, phoneToken, consent: { terms: true, communication: false, location: true } }) })
    assert.equal(res.status, 400)
    assert.ok(res.body.details.some(d => d.field === 'consent.communication'))
  })

  test('home tuition needs an address and pincode; online does not', async () => {
    const phone = nextPhone()
    const phoneToken = await verifiedPhone(server, phone, 'parent')
    const missing = await server.request('POST', '/api/parents/register', {
      body: parentBody({ phone, phoneToken, address: undefined, pincode: undefined, latitude: undefined, longitude: undefined }),
    })
    assert.equal(missing.status, 400)
    assert.deepEqual(missing.body.details.map(d => d.field).sort(), ['address', 'pincode'])

    const online = await registerParent(server, { mode: 'online', address: undefined, pincode: undefined, latitude: undefined, longitude: undefined, consent: { terms: true, communication: true } })
    assert.equal(online.lead.mode, 'online')
  })

  test('without coordinates or a maps key the lead falls back to pincode matching', async () => {
    const { lead } = await registerParent(server, { latitude: undefined, longitude: undefined })
    const stored = await server.repo.get('Lead', lead.id)
    assert.equal(stored.latitude, null)
    assert.equal(stored.geocodeSource, 'pincode')
  })
})
