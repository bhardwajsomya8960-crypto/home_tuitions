const { test, before, after, describe } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')

h.configureAdminEnv()
const { openDatabase } = require('../src/config/database')
const { createApp } = require('../src/app')
const { createCatalogueRepository } = require('../src/repositories/catalogueRepository')
const { createCatalogueService } = require('../src/services/catalogueService')
const { createOperationsRepository } = require('../src/repositories/operationsRepository')
const { createOperationsService } = require('../src/services/operations')

// A clock the tests can move forward, so offer expiry is deterministic.
let clock = Date.parse('2026-11-02T04:30:00Z') // Monday 10:00 IST
const advanceMinutes = m => { clock += m * 60000 }

let server
let admin
const req = (method, url, opts) => server.request(method, url, opts)

before(async () => {
  const db = openDatabase(':memory:')
  const catalogueService = createCatalogueService({ repo: createCatalogueRepository(db) })
  const operationsService = createOperationsService({ repo: createOperationsRepository(db), catalogueService, now: () => new Date(clock) })
  server = await h.startServer(createApp({ db, catalogueService, operationsService }))
  server.ops = operationsService
  admin = await h.adminToken(server)
})
after(async () => { if (server) await server.close() })

async function activeTutor(over) {
  const t = await h.registerTutor(server, over)
  await h.activateTutor(server, admin, t)
  return t
}

describe('tutor onboarding and verification', () => {
  test('a new tutor is pending and cannot be verified before documents are accepted', async () => {
    const t = await h.registerTutor(server)
    assert.equal(t.tutor.status, 'pending')
    const early = await req('POST', `/api/admin/tutors/${t.tutor.id}/actions`, { token: admin, body: { action: 'verify' } })
    assert.equal(early.status, 409)
  })

  test('uploading the required documents moves the tutor to documents_submitted', async () => {
    const t = await h.registerTutor(server)
    for (const [type, buf, name] of [['photo', h.PNG, 'p.png'], ['identity', h.PDF, 'i.pdf'], ['qualification', h.PDF, 'q.pdf']]) {
      assert.equal((await h.uploadDocument(server, t.token, type, buf, name)).status, 201)
    }
    const me = await req('GET', '/api/tutors/me/overview', { token: t.token })
    assert.equal(me.body.tutor.status, 'documents_submitted')
    assert.equal(me.body.tutor.documents.length, 3)
  })

  test('uploads are checked by file content, type and size', async () => {
    const t = await h.registerTutor(server)
    const fake = await h.uploadDocument(server, t.token, 'identity', Buffer.from('MZ not a pdf'), 'id.pdf')
    assert.equal(fake.status, 415)
    const pdfPhoto = await h.uploadDocument(server, t.token, 'photo', h.PDF, 'photo.pdf')
    assert.equal(pdfPhoto.status, 415)
    const badType = await h.uploadDocument(server, t.token, 'passport', h.PDF, 'x.pdf')
    assert.equal(badType.status, 400)
    const big = await h.uploadDocument(server, t.token, 'identity', Buffer.concat([h.PDF, Buffer.alloc(5 * 1024 * 1024)]), 'big.pdf')
    assert.equal(big.status, 413)
  })

  test('a tutor can download only their own documents; admin can download any', async () => {
    const a = await h.registerTutor(server)
    const b = await h.registerTutor(server)
    const up = await h.uploadDocument(server, a.token, 'identity', h.PDF, 'id.pdf')
    const own = await fetch(`${server.base}/api/tutors/me/documents/${up.body.id}/file`, { headers: { Authorization: `Bearer ${a.token}` } })
    assert.equal(own.status, 200)
    const other = await req('GET', `/api/tutors/me/documents/${up.body.id}/file`, { token: b.token })
    assert.equal(other.status, 404)
    const asAdmin = await fetch(`${server.base}/api/admin/documents/${up.body.id}/file`, { headers: { Authorization: `Bearer ${admin}` } })
    assert.equal(asAdmin.status, 200)
    assert.equal(asAdmin.headers.get('content-type'), 'application/pdf')
  })

  test('rejecting or suspending needs a reason; suspension withdraws open offers', async () => {
    const t = await activeTutor()
    const noReason = await req('POST', `/api/admin/tutors/${t.tutor.id}/actions`, { token: admin, body: { action: 'suspend' } })
    assert.equal(noReason.status, 400)
    const ok = await req('POST', `/api/admin/tutors/${t.tutor.id}/actions`, { token: admin, body: { action: 'suspend', notes: 'Complaint under review' } })
    assert.equal(ok.body.status, 'suspended')
  })

  test('a tutor can update availability and pause new leads', async () => {
    const t = await h.registerTutor(server)
    const res = await req('PATCH', '/api/tutors/me', { token: t.token, body: { availability: [{ day: 'mon', slot: 'night' }], acceptingLeads: false } })
    assert.equal(res.status, 200)
    assert.deepEqual(res.body.availability, [{ day: 'mon', slot: 'night' }])
    assert.equal(res.body.acceptingLeads, false)
    const bad = await req('PATCH', '/api/tutors/me', { token: t.token, body: { status: 'active' } })
    assert.equal(bad.status, 400, 'tutors cannot change their own status')
  })
})

describe('lead to enrolment (blueprint §25)', () => {
  // Three tutors at different distances from an Ameerpet parent, plus ones filtered out.
  let near, mid, far, outside, parent, leadId

  before(async () => {
    // Earlier tests may have left active tutors; suspend them so this ranking is self-contained.
    for (const t of server.ops.ctx.repo.find('tutors', { status: 'active' })) {
      server.ops.ctx.repo.update('tutors', t.id, { status: 'suspended' })
    }
    near = await activeTutor({ name: 'Near Tutor', ...h.PLACES.begumpet })
    mid = await activeTutor({ name: 'Mid Tutor', ...h.PLACES.secunderabad })
    far = await activeTutor({ name: 'Far Tutor', ...h.PLACES.kukatpally })
    outside = await activeTutor({ name: 'Outside Tutor', ...h.PLACES.gachibowli, serviceRadiusKm: 8 })
    await activeTutor({ name: 'Wrong Class', classes: ['11', '12'] })
    await h.registerTutor(server, { name: 'Unverified Tutor' })
    parent = await h.registerParent(server, { studentName: 'Aarav', specialRequirements: 'Needs help with algebra' })
    leadId = parent.lead.id
  })

  test('the lead starts as new with a parent-friendly timeline', () => {
    assert.equal(parent.lead.status, 'new')
    assert.equal(parent.lead.timeline[0].text, 'Request received')
  })

  test('staff can qualify the lead, and invalid manual transitions are refused', async () => {
    const bad = await req('POST', `/api/admin/leads/${leadId}/status`, { token: admin, body: { status: 'converted' } })
    assert.equal(bad.status, 409)
    const ok = await req('POST', `/api/admin/leads/${leadId}/status`, { token: admin, body: { status: 'qualified', note: 'Spoke to parent' } })
    assert.equal(ok.body.status, 'qualified')
  })

  test('matching returns only eligible tutors, ranked, with reasons', async () => {
    const res = await req('POST', `/api/admin/leads/${leadId}/match`, { token: admin })
    assert.equal(res.status, 200)
    assert.equal(res.body.status, 'matching')
    const names = res.body.latestMatch.results.map(r => r.tutorName)
    assert.deepEqual(names, ['Near Tutor', 'Mid Tutor', 'Far Tutor'])
    assert.equal(res.body.latestMatch.excludedCount, 2, 'outside radius and wrong class; unverified tutors are never considered')
    assert.ok(res.body.latestMatch.results[0].reasons[0].includes('km away'))
  })

  test('offers go to one tutor at a time, who sees no parent contact details', async () => {
    const res = await req('POST', `/api/admin/leads/${leadId}/offers`, { token: admin })
    assert.equal(res.body.status, 'tutor_offered')
    assert.equal(res.body.assignments.filter(a => a.status === 'offered').length, 1)

    const view = await req('GET', '/api/tutors/me/overview', { token: near.token })
    const offer = view.body.offers[0]
    assert.ok(offer.secondsLeft > 0 && offer.secondsLeft <= 600)
    assert.equal(offer.lead.locality, `Pincode ${h.PLACES.ameerpet.pincode}`)
    assert.equal(offer.contact, undefined)
    const json = JSON.stringify(offer)
    assert.ok(!json.includes(parent.phone), 'parent phone must not be visible')
    assert.ok(!json.includes('Aarav'), 'student name must not be visible')
    assert.ok(!json.includes('Test Street'), 'address must not be visible')
  })

  test('other tutors cannot act on the offer', async () => {
    const offerId = server.ops.ctx.repo.findOne('assignments', { leadId, tutorId: near.tutor.id }).id
    const res = await req('POST', `/api/tutors/me/offers/${offerId}/accept`, { token: mid.token })
    assert.equal(res.status, 404)
  })

  test('an expired offer moves automatically to the next tutor', async () => {
    advanceMinutes(11)
    const lead = await req('GET', `/api/admin/leads/${leadId}`, { token: admin })
    const byTutor = Object.fromEntries(lead.body.assignments.map(a => [a.tutorName, a.status]))
    assert.equal(byTutor['Near Tutor'], 'expired')
    assert.equal(byTutor['Mid Tutor'], 'offered')

    const late = await req('POST', `/api/tutors/me/offers/${lead.body.assignments[0].id}/accept`, { token: near.token })
    assert.equal(late.status, 409)
  })

  test('a rejection needs a structured reason and moves to the next tutor', async () => {
    const offerId = server.ops.ctx.repo.findOne('assignments', { leadId, tutorId: mid.tutor.id }).id
    const noReason = await req('POST', `/api/tutors/me/offers/${offerId}/reject`, { token: mid.token, body: {} })
    assert.equal(noReason.status, 400)
    const other = await req('POST', `/api/tutors/me/offers/${offerId}/reject`, { token: mid.token, body: { reason: 'other' } })
    assert.equal(other.status, 400, '"other" needs a comment')
    const ok = await req('POST', `/api/tutors/me/offers/${offerId}/reject`, { token: mid.token, body: { reason: 'schedule_conflict' } })
    assert.equal(ok.body.status, 'rejected')
    const farView = await req('GET', '/api/tutors/me/overview', { token: far.token })
    assert.equal(farView.body.offers.length, 1)
  })

  test('the tutor can ask for more information while the offer is open', async () => {
    const offerId = server.ops.ctx.repo.findOne('assignments', { leadId, tutorId: far.tutor.id }).id
    const res = await req('POST', `/api/tutors/me/offers/${offerId}/request-info`, { token: far.token, body: { message: 'Is the student preparing for an exam?' } })
    assert.equal(res.status, 200)
    const ops = await req('GET', '/api/admin/operations', { token: admin })
    assert.equal(ops.body.infoRequests.length, 1)
  })

  test('accepting reserves the tutor; contact details appear only after confirmation', async () => {
    const offerId = server.ops.ctx.repo.findOne('assignments', { leadId, tutorId: far.tutor.id }).id
    const accepted = await req('POST', `/api/tutors/me/offers/${offerId}/accept`, { token: far.token })
    assert.equal(accepted.status, 200)
    assert.equal(accepted.body.status, 'accepted')
    assert.equal(accepted.body.contact, undefined)

    const parentView = await req('GET', '/api/parents/me/overview', { token: parent.token })
    const request = parentView.body.requests[0]
    assert.equal(request.status, 'tutor_accepted')
    assert.equal(request.tutor.name, 'Far Tutor')
    assert.equal(request.tutor.phone, undefined, 'tutor phone hidden until confirmed')

    const ops = await req('GET', '/api/admin/operations', { token: admin })
    assert.equal(ops.body.awaitingConfirmation.length, 1)
    const confirmed = await req('POST', `/api/admin/assignments/${offerId}/confirm`, { token: admin })
    assert.equal(confirmed.status, 200)

    const tutorView = await req('GET', '/api/tutors/me/overview', { token: far.token })
    assert.equal(tutorView.body.assignments[0].contact.phone, parent.phone)
    const parentAfter = await req('GET', '/api/parents/me/overview', { token: parent.token })
    assert.equal(parentAfter.body.requests[0].tutor.phone, far.phone)
  })

  test('a demo can be scheduled, missed, rescheduled and completed', async () => {
    const past = await req('POST', `/api/admin/leads/${leadId}/demos`, { token: admin, body: { scheduledAt: new Date(clock - 3600e3).toISOString(), mode: 'home' } })
    assert.equal(past.status, 400)
    const first = await req('POST', `/api/admin/leads/${leadId}/demos`, { token: admin, body: { scheduledAt: new Date(clock + 86400e3).toISOString(), mode: 'home' } })
    assert.equal(first.status, 201)
    assert.equal(first.body.status, 'demo_scheduled')

    const demoId = first.body.demos[0].id
    const noShow = await req('POST', `/api/admin/demos/${demoId}/no-show`, { token: admin, body: { party: 'parent' } })
    assert.equal(noShow.body.status, 'tutor_accepted')

    const second = await req('POST', `/api/admin/leads/${leadId}/demos`, { token: admin, body: { scheduledAt: new Date(clock + 2 * 86400e3).toISOString(), mode: 'home' } })
    const secondId = second.body.demos.find(d => d.status === 'scheduled').id
    const moved = await req('POST', `/api/admin/demos/${secondId}/reschedule`, { token: admin, body: { scheduledAt: new Date(clock + 3 * 86400e3).toISOString() } })
    assert.equal(moved.status, 200)

    const parentAsk = await req('POST', `/api/parents/me/demos/${secondId}/reschedule-request`, { token: parent.token, body: { message: 'Saturday morning please' } })
    assert.equal(parentAsk.status, 200)

    const done = await req('POST', `/api/admin/demos/${secondId}/complete`, { token: admin, body: { notes: 'Went well' } })
    assert.equal(done.body.status, 'demo_completed')
  })

  test('acceptance is not conversion: converting needs a completed demo (rule 6)', async () => {
    const other = await h.registerParent(server)
    const res = await req('POST', `/api/admin/leads/${other.lead.id}/convert`, { token: admin, body: { plan: 'monthly', feeAmount: 3000, startDate: '2026-11-09', schedule: [{ day: 'tue', slot: 'evening' }] } })
    assert.equal(res.status, 409)
  })

  test('the parent records the demo outcome and rates the tutor', async () => {
    const overview = await req('GET', '/api/parents/me/overview', { token: parent.token })
    const demo = overview.body.requests[0].demos.find(d => d.status === 'completed')
    const outcome = await req('POST', `/api/parents/me/demos/${demo.id}/outcome`, { token: parent.token, body: { outcome: 'interested' } })
    assert.equal(outcome.status, 200)
    const review = await req('POST', `/api/parents/me/requests/${leadId}/review`, { token: parent.token, body: { rating: 5, comment: 'Clear explanations' } })
    assert.equal(review.status, 201)
    const twice = await req('POST', `/api/parents/me/requests/${leadId}/review`, { token: parent.token, body: { rating: 1 } })
    assert.equal(twice.status, 409)
    assert.equal(server.ops.ctx.repo.get('tutors', far.tutor.id).ratingAvg, 5)
  })

  test('conversion creates the enrolment, first invoice and upcoming classes', async () => {
    const res = await req('POST', `/api/admin/leads/${leadId}/convert`, {
      token: admin,
      body: { plan: 'monthly', feeAmount: 3000, startDate: '2026-11-03', schedule: [{ day: 'tue', slot: 'evening' }, { day: 'thu', slot: 'evening' }] },
    })
    assert.equal(res.status, 201)
    assert.equal(res.body.status, 'converted')
    assert.equal(res.body.enrolment.status, 'active')

    const overview = await req('GET', '/api/parents/me/overview', { token: parent.token })
    assert.equal(overview.body.invoices.length, 1)
    assert.equal(overview.body.invoices[0].amount, 3000)
    assert.equal(overview.body.stats.amountDue, 3000)
    assert.ok(overview.body.upcomingClasses.length >= 4, 'two weeks of Tue/Thu classes')
    assert.ok(overview.body.upcomingClasses.every(c => c.tutorName === 'Far Tutor'))
  })

  test('the tutor records attendance; the parent acknowledges it', async () => {
    const tutorView = await req('GET', '/api/tutors/me/overview', { token: far.token })
    const session = tutorView.body.classes[0]
    const early = await req('POST', `/api/tutors/me/classes/${session.id}/attendance`, { token: far.token, body: { tutorPresent: true, studentPresent: true } })
    assert.equal(early.status, 409, 'cannot record a future class')

    clock = Date.parse(`${session.scheduledDate}T13:00:00Z`)
    const ok = await req('POST', `/api/tutors/me/classes/${session.id}/attendance`, { token: far.token, body: { tutorPresent: true, studentPresent: true, notes: 'Linear equations', homework: 'Exercise 4.2' } })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.status, 'completed')

    const otherTutor = await req('POST', `/api/tutors/me/classes/${session.id}/attendance`, { token: near.token, body: { tutorPresent: true, studentPresent: true } })
    assert.equal(otherTutor.status, 404)

    const ack = await req('POST', `/api/parents/me/classes/${session.id}/acknowledge`, { token: parent.token })
    assert.equal(ack.status, 200)
    assert.ok(ack.body.parentAckAt)
  })

  test('payments are recorded against the invoice and are traceable', async () => {
    const invoices = await req('GET', '/api/admin/invoices', { token: admin })
    const inv = invoices.body.items.find(i => i.parentName === 'Test Parent' && i.amount === 3000)
    const tooMuch = await req('POST', `/api/admin/invoices/${inv.id}/payments`, { token: admin, body: { amount: 5000, method: 'upi', paidOn: '2026-11-05' } })
    assert.equal(tooMuch.status, 400)
    const part = await req('POST', `/api/admin/invoices/${inv.id}/payments`, { token: admin, body: { amount: 1000, method: 'upi', reference: 'UPI123', paidOn: '2026-11-05' } })
    assert.equal(part.body.status, 'partial')
    const rest = await req('POST', `/api/admin/invoices/${inv.id}/payments`, { token: admin, body: { amount: 2000, method: 'cash', paidOn: '2026-11-06' } })
    assert.equal(rest.body.status, 'paid')
    assert.equal(rest.body.payments.length, 2)
    const voided = await req('POST', `/api/admin/invoices/${inv.id}/void`, { token: admin })
    assert.equal(voided.status, 409)
  })

  test('the lead history is complete and the audit trail records each step', async () => {
    const lead = await req('GET', `/api/admin/leads/${leadId}`, { token: admin })
    const types = lead.body.events.map(e => e.type)
    for (const t of ['created', 'matched', 'offer_sent', 'offer_expired', 'offer_rejected', 'info_requested', 'offer_accepted', 'assignment_confirmed', 'demo_scheduled', 'demo_no_show', 'demo_rescheduled', 'reschedule_requested', 'demo_completed', 'demo_outcome', 'converted']) {
      assert.ok(types.includes(t), `missing ${t}`)
    }
    const audit = await req('GET', '/api/admin/audit?limit=100', { token: admin })
    const actions = new Set(audit.body.items.map(a => a.action))
    for (const a of ['lead.create', 'assignment.offer', 'assignment.accept', 'assignment.confirm', 'demo.schedule', 'enrolment.create', 'payment.record', 'tutor.status']) {
      assert.ok(actions.has(a), `missing audit ${a}`)
    }
  })

  test('the dashboard reconciles with the stored records', async () => {
    const dash = await req('GET', '/api/admin/dashboard', { token: admin })
    const repo = server.ops.ctx.repo
    assert.equal(dash.body.leads.total, repo.count('leads'))
    assert.equal(dash.body.leads.byStatus.converted, repo.count('leads', { status: 'converted' }))
    assert.equal(dash.body.enrolments.active, repo.count('enrolments', { status: 'active' }))
    assert.equal(dash.body.finance.collected, 3000)
  })
})

describe('concurrency and the no-tutor queue', () => {
  test('with simultaneous offers, the first acceptance wins and the rest are withdrawn', async () => {
    const put = await req('PUT', '/api/admin/settings', { token: admin, body: { maxSimultaneousOffers: 3 } })
    assert.equal(put.status, 200)
    for (const t of server.ops.ctx.repo.find('tutors', { status: 'active' })) server.ops.ctx.repo.update('tutors', t.id, { status: 'suspended' })
    const tutors = [await activeTutor(), await activeTutor(), await activeTutor()]
    const p = await h.registerParent(server)
    await req('POST', `/api/admin/leads/${p.lead.id}/match`, { token: admin })
    const offered = await req('POST', `/api/admin/leads/${p.lead.id}/offers`, { token: admin })
    assert.equal(offered.body.assignments.filter(a => a.status === 'offered').length, 3)

    const ids = tutors.map(t => server.ops.ctx.repo.findOne('assignments', { leadId: p.lead.id, tutorId: t.tutor.id }).id)
    const results = await Promise.all(tutors.map((t, i) => req('POST', `/api/tutors/me/offers/${ids[i]}/accept`, { token: t.token })))
    assert.equal(results.filter(r => r.status === 200).length, 1)
    assert.equal(results.filter(r => r.status === 409).length, 2)
    const final = server.ops.ctx.repo.find('assignments', { leadId: p.lead.id }).map(a => a.status).sort()
    assert.deepEqual(final, ['accepted', 'withdrawn', 'withdrawn'])
    await req('PUT', '/api/admin/settings', { token: admin, body: { maxSimultaneousOffers: 1 } })
  })

  test('when every tutor declines, the lead enters the no-tutor queue', async () => {
    for (const t of server.ops.ctx.repo.find('tutors', { status: 'active' })) server.ops.ctx.repo.update('tutors', t.id, { status: 'suspended' })
    const only = await activeTutor()
    const p = await h.registerParent(server)
    await req('POST', `/api/admin/leads/${p.lead.id}/match`, { token: admin })
    await req('POST', `/api/admin/leads/${p.lead.id}/offers`, { token: admin })
    const offerId = server.ops.ctx.repo.findOne('assignments', { leadId: p.lead.id }).id
    await req('POST', `/api/tutors/me/offers/${offerId}/unavailable`, { token: only.token, body: {} })
    const ops = await req('GET', '/api/admin/operations', { token: admin })
    assert.ok(ops.body.noTutor.some(l => l.id === p.lead.id))
    const lead = await req('GET', `/api/admin/leads/${p.lead.id}`, { token: admin })
    assert.equal(lead.body.status, 'matching')
    assert.ok(lead.body.events.some(e => e.type === 'no_tutor_available'))
  })

  test('slots taken by a tutor\'s active students are not offered again (rule 3)', async () => {
    // The converted lead above booked Far Tutor for Tue and Thu evenings.
    const far = server.ops.ctx.repo.findOne('tutors', { name: 'Far Tutor' })
    server.ops.ctx.repo.update('tutors', far.id, { status: 'active' })
    for (const t of server.ops.ctx.repo.find('tutors', { status: 'active' })) {
      if (t.id !== far.id) server.ops.ctx.repo.update('tutors', t.id, { status: 'suspended' })
    }
    const p = await h.registerParent(server, { ...h.PLACES.kukatpally, preferredDays: ['tue', 'thu'], preferredSlots: ['evening'] })
    const busy = await req('POST', `/api/admin/leads/${p.lead.id}/match`, { token: admin })
    assert.equal(busy.body.latestMatch.results.length, 0, 'fully booked at the requested times')

    const q = await h.registerParent(server, { ...h.PLACES.kukatpally, preferredDays: ['sat'], preferredSlots: ['morning'] })
    const free = await req('POST', `/api/admin/leads/${q.lead.id}/match`, { token: admin })
    assert.deepEqual(free.body.latestMatch.results.map(r => r.tutorName), ['Far Tutor'])
  })

  test('a lead with no eligible tutors is flagged straight away', async () => {
    const p = await h.registerParent(server, { studentClass: 'Nursery' })
    const res = await req('POST', `/api/admin/leads/${p.lead.id}/match`, { token: admin })
    assert.equal(res.body.latestMatch.results.length, 0)
    assert.equal(res.body.noTutorFound, true)
  })
})

describe('parents and staff', () => {
  test('a parent can add a student and raise a new request; duplicates are flagged', async () => {
    const p = await h.registerParent(server)
    const student = await req('POST', '/api/parents/me/students', { token: p.token, body: { studentName: 'Sibling', studentClass: '5', board: 'ICSE' } })
    assert.equal(student.status, 201)
    const request = await req('POST', '/api/parents/me/requests', {
      token: p.token,
      body: { studentId: student.body.id, subjects: ['English'], mode: 'online', preferredDays: ['sat'], preferredSlots: ['morning'] },
    })
    assert.equal(request.status, 201)
    assert.equal(request.body.class, '5')

    const dup = await req('POST', '/api/parents/me/requests', {
      token: p.token,
      body: { studentId: student.body.id, subjects: ['English'], mode: 'online', preferredDays: ['sat'], preferredSlots: ['morning'] },
    })
    const events = server.ops.ctx.repo.find('lead_events', { leadId: dup.body.id }).map(e => e.type)
    assert.ok(events.includes('duplicate_suspected'))
  })

  test('a parent cannot see or change another parent\'s request', async () => {
    const a = await h.registerParent(server)
    const b = await h.registerParent(server)
    const res = await req('POST', `/api/parents/me/requests/${a.lead.id}/cancel`, { token: b.token, body: {} })
    assert.equal(res.status, 404)
    const own = await req('POST', `/api/parents/me/requests/${a.lead.id}/cancel`, { token: a.token, body: { reason: 'Found a tutor' } })
    assert.equal(own.body.status, 'cancelled')
  })

  test('staff can create a lead for a caller and mark a lead lost with a reason', async () => {
    const res = await req('POST', '/api/admin/leads', {
      token: admin,
      body: {
        name: 'Caller Parent', phone: h.nextPhone(), relationship: 'Guardian', studentName: 'Kid', studentClass: '9', board: 'State',
        subjects: ['Science'], mode: 'online', preferredDays: ['mon'], preferredSlots: ['evening'], source: 'whatsapp', note: 'Called in',
      },
    })
    assert.equal(res.status, 201)
    assert.equal(res.body.source, 'whatsapp')
    const noReason = await req('POST', `/api/admin/leads/${res.body.id}/status`, { token: admin, body: { status: 'lost' } })
    assert.equal(noReason.status, 400)
    const lost = await req('POST', `/api/admin/leads/${res.body.id}/status`, { token: admin, body: { status: 'lost', reason: 'budget' } })
    assert.equal(lost.body.lostReason, 'budget')
  })

  test('settings reject weights that do not add up to 100', async () => {
    const res = await req('PUT', '/api/admin/settings', { token: admin, body: { weights: { distance: 50 } } })
    assert.equal(res.status, 400)
    const unknown = await req('PUT', '/api/admin/settings', { token: admin, body: { secretMode: true } })
    assert.equal(unknown.status, 400)
  })

  test('lead lists filter and search', async () => {
    const res = await req('GET', '/api/admin/leads?status=converted', { token: admin })
    assert.ok(res.body.items.length >= 1)
    assert.ok(res.body.items.every(l => l.status === 'converted'))
    const search = await req('GET', '/api/admin/leads?q=Caller', { token: admin })
    assert.equal(search.body.items[0].parentName, 'Caller Parent')
  })
})
