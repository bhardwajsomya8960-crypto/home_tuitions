const { test, before, after, describe } = require('node:test')
const assert = require('node:assert/strict')
const { configureAdminEnv, startServer, ADMIN_EMAIL, ADMIN_PASSWORD } = require('./helpers')

configureAdminEnv()
const catalyst = require('../src/config/catalyst')
const { createApp } = require('../src/app')
const { openDatabase } = require('../src/config/database')
const { createCatalogueRepository } = require('../src/repositories/catalogueRepository')
const { createCatalogueService } = require('../src/services/catalogueService')

let server
let token

before(async () => {
  const service = createCatalogueService({ repo: createCatalogueRepository(openDatabase(':memory:')) })
  server = await startServer(createApp({ catalogueService: service }))
  const login = await server.request('POST', '/api/admin/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  token = login.body.token
})
after(async () => { if (server) await server.close() })

async function seedTutor(overrides = {}) {
  return catalyst.createTutor({ name: 'Test Tutor', subjects: ['Maths'], classes: [8], boards: ['CBSE'], ...overrides })
}

describe('admin operations read from the store', () => {
  test('dashboard counts reflect stored tutors and leads', async () => {
    const before = await server.request('GET', '/api/admin/dashboard', { token })
    assert.equal(before.status, 200)
    const tutor = await seedTutor()
    const converted = await catalyst.createLead({ student_name: 'A' })
    await catalyst.updateRecord('leads', converted.id, { status: 'converted' })
    await catalyst.createLead({ student_name: 'B' })

    const res = await server.request('GET', '/api/admin/dashboard', { token })
    assert.equal(res.status, 200)
    assert.equal(res.body.totalTutors, before.body.totalTutors + 1)
    assert.equal(res.body.pendingVerification, before.body.pendingVerification + 1)
    assert.equal(res.body.totalLeads, before.body.totalLeads + 2)
    assert.equal(res.body.newLeads, before.body.newLeads + 1)
    assert.equal(res.body.convertedLeads, before.body.convertedLeads + 1)
    assert.ok(tutor.id)
  })

  test('tutors list filters by verification status and paginates', async () => {
    const t = await seedTutor({ name: 'Filter Me' })
    const pending = await server.request('GET', '/api/admin/tutors?status=pending&limit=1000', { token })
    assert.equal(pending.status, 200)
    assert.ok(pending.body.tutors.some(x => x.id === t.id))
    assert.ok(pending.body.tutors.every(x => x.verification_status === 'pending'))
    assert.equal(pending.body.limit, 100)

    const page = await server.request('GET', '/api/admin/tutors?limit=1&offset=0', { token })
    assert.equal(page.body.tutors.length, 1)
    assert.equal(page.body.total, catalyst.data.tutors.length)
  })

  test('users combines parents and tutors and filters by role', async () => {
    await catalyst.createParent({ name: 'Parent One', phone: '9000000001' })
    const all = await server.request('GET', '/api/admin/users?limit=100', { token })
    assert.equal(all.status, 200)
    assert.ok(all.body.users.some(u => u.role === 'parent'))
    assert.ok(all.body.users.some(u => u.role === 'tutor'))

    const parents = await server.request('GET', '/api/admin/users?role=parent&limit=100', { token })
    assert.ok(parents.body.users.length > 0)
    assert.ok(parents.body.users.every(u => u.role === 'parent'))
  })

  test('lead pipeline counts each stage', async () => {
    const res = await server.request('GET', '/api/admin/leads/pipeline', { token })
    assert.equal(res.status, 200)
    assert.deepEqual(Object.keys(res.body).sort(), ['accepted', 'contacted', 'converted', 'lost', 'matching', 'new', 'offered', 'qualified'])
    assert.ok(res.body.new >= 1)
  })
})

describe('tutor KYC decision', () => {
  test('verifying a tutor updates the stored record and dashboard counts', async () => {
    const tutor = await seedTutor({ name: 'To Verify' })
    const before = await server.request('GET', '/api/admin/dashboard', { token })

    const res = await server.request('POST', `/api/admin/tutors/${tutor.id}/verify`, { token, body: { status: 'verified', notes: 'KYC ok' } })
    assert.equal(res.status, 200)
    assert.equal(res.body.tutor.verification_status, 'verified')
    assert.equal(res.body.tutor.verification_notes, 'KYC ok')

    const after = await server.request('GET', '/api/admin/dashboard', { token })
    assert.equal(after.body.activeTutors, before.body.activeTutors + 1)
    assert.equal(after.body.pendingVerification, before.body.pendingVerification - 1)
  })

  test('rejects an unknown decision without changing the tutor', async () => {
    const tutor = await seedTutor({ name: 'Bad Decision' })
    const res = await server.request('POST', `/api/admin/tutors/${tutor.id}/verify`, { token, body: { status: 'active' } })
    assert.equal(res.status, 400)
    assert.equal(catalyst.data.tutors.find(t => t.id === tutor.id).verification_status, 'pending')
  })

  test('returns 404 for an unknown tutor', async () => {
    const res = await server.request('POST', '/api/admin/tutors/does-not-exist/verify', { token, body: { status: 'verified' } })
    assert.equal(res.status, 404)
  })

  test('rejects non-string notes', async () => {
    const tutor = await seedTutor({ name: 'Bad Notes' })
    const res = await server.request('POST', `/api/admin/tutors/${tutor.id}/verify`, { token, body: { status: 'rejected', notes: 42 } })
    assert.equal(res.status, 400)
  })

  test('requires an admin token', async () => {
    const tutor = await seedTutor({ name: 'No Auth' })
    const res = await server.request('POST', `/api/admin/tutors/${tutor.id}/verify`, { body: { status: 'verified' } })
    assert.equal(res.status, 401)
  })
})
