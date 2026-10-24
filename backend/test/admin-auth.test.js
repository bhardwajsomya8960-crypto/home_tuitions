const { test, before, after, describe } = require('node:test')
const assert = require('node:assert/strict')
const jwt = require('jsonwebtoken')
const { configureAdminEnv, startServer, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SECRET } = require('./helpers')

configureAdminEnv()
const { openDatabase } = require('../src/config/database')
const { createCatalogueRepository } = require('../src/repositories/catalogueRepository')
const { createCatalogueService } = require('../src/services/catalogueService')
const { createApp } = require('../src/app')

let server

before(async () => {
  const db = openDatabase(':memory:')
  const service = createCatalogueService({ repo: createCatalogueRepository(db) })
  server = await startServer(createApp({ catalogueService: service, db }))
})
after(async () => { if (server) await server.close() })

const ADMIN_ROUTES = [
  ['GET', '/api/admin/catalogue/categories'],
  ['POST', '/api/admin/catalogue/categories'],
  ['PATCH', '/api/admin/catalogue/courses/some-id'],
  ['POST', '/api/admin/catalogue/courses/some-id/publish'],
  ['GET', '/api/admin/dashboard'],
  ['GET', '/api/admin/leads'],
  ['GET', '/api/admin/operations'],
  ['PUT', '/api/admin/settings'],
  ['POST', '/api/admin/tutors/some-id/actions'],
]

describe('admin login', () => {
  test('rejects a wrong password with a generic message', async () => {
    const res = await server.request('POST', '/api/admin/auth/login', { body: { email: ADMIN_EMAIL, password: 'wrong-password-here' } })
    assert.equal(res.status, 401)
    assert.equal(res.body.code, 'INVALID_CREDENTIALS')
    assert.equal(res.body.error, 'Invalid email or password')
  })

  test('rejects an unknown email with the same generic message', async () => {
    const res = await server.request('POST', '/api/admin/auth/login', { body: { email: 'nobody@test.local', password: ADMIN_PASSWORD } })
    assert.equal(res.status, 401)
    assert.equal(res.body.error, 'Invalid email or password')
  })

  test('accepts the correct credentials and returns a bearer token', async () => {
    const res = await server.request('POST', '/api/admin/auth/login', { body: { email: ADMIN_EMAIL.toUpperCase(), password: ADMIN_PASSWORD } })
    assert.equal(res.status, 200)
    assert.equal(res.body.tokenType, 'Bearer')
    const decoded = jwt.decode(res.body.token)
    assert.equal(decoded.role, 'admin')
    assert.equal(decoded.sub, 'admin')
    assert.ok(decoded.exp > decoded.iat)
  })

  test('rejects missing or non-string credentials', async () => {
    const missing = await server.request('POST', '/api/admin/auth/login', { body: {} })
    assert.equal(missing.status, 400)
    const numeric = await server.request('POST', '/api/admin/auth/login', { body: { email: ADMIN_EMAIL, password: 12345678 } })
    assert.equal(numeric.status, 400)
  })

});

describe('admin route protection', () => {
  test('every admin route rejects requests without a token', async () => {
    for (const [method, url] of ADMIN_ROUTES) {
      const res = await server.request(method, url, { body: method === 'GET' ? undefined : {} })
      assert.equal(res.status, 401, `${method} ${url} should require a token`)
      assert.equal(res.body.code, 'UNAUTHENTICATED')
    }
  })

  test('forged token signed with the wrong secret is rejected', async () => {
    const forged = jwt.sign({ sub: 'admin', role: 'admin' }, 'x'.repeat(40), { audience: 'home-tution-admin', issuer: 'home-tution-api' })
    const res = await server.request('GET', '/api/admin/catalogue/categories', { token: forged })
    assert.equal(res.status, 401)
  })

  test('a parent token signed with the user secret is rejected on admin routes', async () => {
    const parentToken = jwt.sign({ userId: 'x', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' })
    const res = await server.request('GET', '/api/admin/catalogue/categories', { token: parentToken })
    assert.equal(res.status, 401)
  })

  test('an admin-secret token with the wrong role is forbidden', async () => {
    const notAdmin = jwt.sign({ sub: 'admin', role: 'parent' }, ADMIN_SECRET, { algorithm: 'HS256', audience: 'home-tution-admin', issuer: 'home-tution-api' })
    const res = await server.request('GET', '/api/admin/catalogue/categories', { token: notAdmin })
    assert.equal(res.status, 403)
    assert.equal(res.body.code, 'FORBIDDEN')
  })

  test('an expired admin token is rejected', async () => {
    const expired = jwt.sign({ sub: 'admin', role: 'admin' }, ADMIN_SECRET, {
      algorithm: 'HS256', audience: 'home-tution-admin', issuer: 'home-tution-api', expiresIn: -10,
    })
    const res = await server.request('GET', '/api/admin/catalogue/categories', { token: expired })
    assert.equal(res.status, 401)
  })

  test('a valid admin token can reach admin routes', async () => {
    const login = await server.request('POST', '/api/admin/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
    const me = await server.request('GET', '/api/admin/auth/me', { token: login.body.token })
    assert.equal(me.status, 200)
    assert.equal(me.body.role, 'admin')
  })
})

describe('role cannot be obtained from request input', () => {
  test('OTP sign-in refuses the admin role before checking the code', async () => {
    const res = await server.request('POST', '/api/auth/verify-otp', { body: { phone: '9999999999', code: '123456', role: 'admin', purpose: 'login' } })
    assert.equal(res.status, 400)
    assert.equal(res.body.code, 'VALIDATION_FAILED')
    assert.ok(res.body.details.some(d => d.field === 'role'))
  })

  test('extra fields such as userType are refused', async () => {
    const res = await server.request('POST', '/api/auth/send-otp', { body: { phone: '9999999999', role: 'parent', purpose: 'login', userType: 'admin' } })
    assert.equal(res.status, 400)
    assert.ok(res.body.details.some(d => d.field === 'userType'))
  })

  test('a parent session token is not accepted on admin routes', async () => {
    const parentToken = server.app.locals.authService.issueSession('parent', 'someone')
    const res = await server.request('GET', '/api/admin/dashboard', { token: parentToken })
    assert.equal(res.status, 401)
  })

  test('an admin token is not accepted on parent routes', async () => {
    const login = await server.request('POST', '/api/admin/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
    const res = await server.request('GET', '/api/parents/me/overview', { token: login.body.token })
    assert.equal(res.status, 401)
  })

  test('a parent token cannot use tutor routes', async () => {
    const parentToken = server.app.locals.authService.issueSession('parent', 'someone')
    const res = await server.request('GET', '/api/tutors/me/overview', { token: parentToken })
    assert.equal(res.status, 403)
  })
})

describe('admin configuration', () => {
  test('admin routes report not-configured when the environment is incomplete', async () => {
    const saved = process.env.ADMIN_PASSWORD_HASH
    delete process.env.ADMIN_PASSWORD_HASH
    try {
      const res = await server.request('POST', '/api/admin/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
      assert.equal(res.status, 503)
      assert.equal(res.body.code, 'ADMIN_NOT_CONFIGURED')
      assert.ok(res.body.details.some(d => d.message.includes('ADMIN_PASSWORD_HASH')), 'outside production the response names the missing setting')
    } finally {
      process.env.ADMIN_PASSWORD_HASH = saved
    }
  })

  test('the admin secret must differ from the user secret', () => {
    const { readAdminConfig } = require('../src/config/adminConfig')
    const cfg = readAdminConfig({ ADMIN_EMAIL: 'a@b.c', ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH, ADMIN_JWT_SECRET: 'z'.repeat(40), JWT_SECRET: 'z'.repeat(40) })
    assert.equal(cfg.configured, false)
    assert.ok(cfg.problems.some(p => p.includes('must differ')))
  })

  test('a short admin secret is refused', () => {
    const { readAdminConfig } = require('../src/config/adminConfig')
    const cfg = readAdminConfig({ ADMIN_EMAIL: 'a@b.c', ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH, ADMIN_JWT_SECRET: 'short' })
    assert.equal(cfg.configured, false)
  })
})

describe('brute-force protection (runs last: it locks the shared test IP)', () => {
  test('repeated failures lock the account and IP with Retry-After', async () => {
    const attacker = { email: 'brute@test.local', password: 'guess-guess-guess' }
    let res
    let attempts = 0
    do {
      res = await server.request('POST', '/api/admin/auth/login', { body: attacker })
      attempts++
    } while (res.status === 401 && attempts < 20)
    assert.equal(res.status, 429, 'lockout should happen within 20 failed attempts')
    assert.equal(res.body.code, 'RATE_LIMITED')
    assert.ok(Number(res.headers.get('retry-after')) > 0)
  })
})
