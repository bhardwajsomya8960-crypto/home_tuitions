const { test, before, after, describe } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')

h.configureAdminEnv()

let server
let admin
const req = (m, u, o) => server.request(m, u, o)

before(async () => {
  server = await h.startTestServer()
  admin = await h.adminToken(server)
})
after(async () => { if (server) await server.close() })

// A verified (not yet active) tutor, as created by the test-user seed.
async function verifiedTutor(over) {
  const t = await h.registerTutor(server, over)
  server.ops.ctx.repo.update('tutors', t.tutor.id, { status: 'verified' })
  return t
}

describe('assign a tutor by name', () => {
  test('search finds tutors by name and explains how each fits the lead', async () => {
    const fits = await verifiedTutor({ name: 'Meera Fits' })
    await verifiedTutor({ name: 'Meera Wrongclass', classes: ['11', '12'] })
    await h.registerTutor(server, { name: 'Meera Pending' })
    const p = await h.registerParent(server)

    const short = await req('GET', `/api/admin/leads/${p.lead.id}/tutor-search?q=m`, { token: admin })
    assert.equal(short.status, 400)

    const res = await req('GET', `/api/admin/leads/${p.lead.id}/tutor-search?q=meera`, { token: admin })
    assert.equal(res.status, 200)
    const byName = Object.fromEntries(res.body.items.map(i => [i.name, i]))
    assert.equal(byName['Meera Fits'].eligible, true)
    assert.ok(byName['Meera Fits'].score > 0)
    assert.equal(byName['Meera Wrongclass'].eligible, false)
    assert.equal(byName['Meera Wrongclass'].reason, 'does not teach this class')
    assert.equal(byName['Meera Pending'].assignable, false)

    const byPhone = await req('GET', `/api/admin/leads/${p.lead.id}/tutor-search?q=${fits.phone.slice(-5)}`, { token: admin })
    assert.ok(byPhone.body.items.some(i => i.id === fits.tutor.id))
  })

  test('direct assignment confirms the tutor and shares contact details', async () => {
    const t = await verifiedTutor({ name: 'Direct Tutor' })
    const p = await h.registerParent(server)
    const res = await req('POST', `/api/admin/leads/${p.lead.id}/assign`, { token: admin, body: { tutorId: t.tutor.id, mode: 'direct' } })
    assert.equal(res.status, 200)
    assert.equal(res.body.status, 'tutor_accepted')
    assert.equal(res.body.assignments.at(-1).status, 'confirmed')
    assert.ok(res.body.events.some(e => e.type === 'manual_assignment'))

    const tutorView = await req('GET', '/api/tutors/me/overview', { token: t.token })
    assert.equal(tutorView.body.assignments[0].contact.phone, p.phone)

    const again = await req('POST', `/api/admin/leads/${p.lead.id}/assign`, { token: admin, body: { tutorId: t.tutor.id, mode: 'direct' } })
    assert.equal(again.status, 409)
    assert.equal(again.body.code, 'ALREADY_ASSIGNED')
  })

  test('a tutor who fails the filters needs a reason, which is recorded', async () => {
    const t = await verifiedTutor({ name: 'Override Tutor', classes: ['11', '12'] })
    const p = await h.registerParent(server)
    const noReason = await req('POST', `/api/admin/leads/${p.lead.id}/assign`, { token: admin, body: { tutorId: t.tutor.id, mode: 'offer' } })
    assert.equal(noReason.status, 400)
    assert.match(noReason.body.details[0].message, /does not teach this class/)

    const ok = await req('POST', `/api/admin/leads/${p.lead.id}/assign`, { token: admin, body: { tutorId: t.tutor.id, mode: 'offer', reason: 'Parent asked for this tutor' } })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.status, 'tutor_offered')
    const offer = ok.body.assignments.at(-1)
    assert.equal(offer.status, 'offered')
    assert.ok(offer.reasons[0].includes('Parent asked for this tutor'))

    const accept = await req('POST', `/api/tutors/me/offers/${offer.id}/accept`, { token: t.token })
    assert.equal(accept.status, 200)
  })

  test('only verified tutors can be assigned', async () => {
    const t = await h.registerTutor(server, { name: 'Not Verified' })
    const p = await h.registerParent(server)
    const res = await req('POST', `/api/admin/leads/${p.lead.id}/assign`, { token: admin, body: { tutorId: t.tutor.id, mode: 'direct', reason: 'try' } })
    assert.equal(res.status, 409)
    assert.equal(res.body.code, 'TUTOR_NOT_VERIFIED')
  })

  test('direct assignment withdraws other open offers', async () => {
    const a = await verifiedTutor({ name: 'Offered First' })
    const b = await verifiedTutor({ name: 'Assigned Second' })
    const p = await h.registerParent(server)
    await req('POST', `/api/admin/leads/${p.lead.id}/assign`, { token: admin, body: { tutorId: a.tutor.id, mode: 'offer' } })
    const res = await req('POST', `/api/admin/leads/${p.lead.id}/assign`, { token: admin, body: { tutorId: b.tutor.id, mode: 'direct' } })
    assert.equal(res.status, 200)
    const statuses = Object.fromEntries(res.body.assignments.map(x => [x.tutorName, x.status]))
    assert.deepEqual(statuses, { 'Offered First': 'withdrawn', 'Assigned Second': 'confirmed' })
  })
})
