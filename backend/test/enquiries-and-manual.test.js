const { test, before, after, describe } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')

h.configureAdminEnv()
process.env.ENQUIRY_RATE_LIMIT = '20'

let server
let admin
const req = (method, url, opts) => server.request(method, url, opts)
const enquire = body => req('POST', '/api/enquiries', { body })

before(async () => {
  server = await h.startTestServer('enquiries')
  admin = await h.adminToken(server)
})
after(async () => { if (server) await server.close() })

describe('website callback form', () => {
  test('only the phone number is required; no account or code is needed', async () => {
    const res = await enquire({ kind: 'parent', phone: '9811100001' })
    assert.equal(res.status, 201)
    assert.deepEqual(res.body, { received: true })

    const list = await req('GET', '/api/admin/enquiries?status=new', { token: admin })
    const row = list.body.items.find(e => e.phone === '9811100001')
    assert.equal(row.kind, 'parent')
    assert.equal(row.source, 'website')
    assert.equal(row.status, 'new')

    assert.equal((await enquire({ kind: 'parent', phone: '12345' })).status, 400)
    assert.equal((await enquire({ kind: 'parent' })).status, 400)
    assert.equal((await enquire({ kind: 'parent', phone: '9811100002', level: 'phd' })).status, 400)
    assert.equal((await enquire({ kind: 'parent', phone: '9811100002', password: 'x' })).status, 400, 'unknown fields are refused')
  })

  test('a repeat from the same number within a week updates the open enquiry', async () => {
    await enquire({ kind: 'tutor', phone: '9811100003', name: 'Asha' })
    await enquire({ kind: 'tutor', phone: '9811100003', level: 'competitive', message: 'JEE maths' })
    const items = (await req('GET', '/api/admin/enquiries?kind=tutor', { token: admin })).body.items.filter(e => e.phone === '9811100003')
    assert.equal(items.length, 1)
    assert.equal(items[0].name, 'Asha')
    assert.equal(items[0].level, 'competitive')
    assert.equal(items[0].repeatCount, 1)
    assert.match(items[0].notes[0].text, /JEE maths/)
  })

  test('bots that fill the hidden field get a thank-you but nothing is stored', async () => {
    const res = await enquire({ kind: 'parent', phone: '9811100004', website: 'http://spam.example' })
    assert.equal(res.status, 201)
    const all = await req('GET', '/api/admin/enquiries?q=9811100004', { token: admin })
    assert.equal(all.body.total, 0)
  })

  test('the admin area needs a staff token', async () => {
    assert.equal((await req('GET', '/api/admin/enquiries')).status, 401)
    assert.equal((await req('POST', '/api/admin/parents', { body: {} })).status, 401)
  })
})

describe('working an enquiry', () => {
  test('staff add call notes, mark it contacted, and must say why when closing', async () => {
    const created = await req('POST', '/api/admin/enquiries', { token: admin, body: { kind: 'parent', phone: '9822200001', name: 'Ravi', source: 'whatsapp' } })
    assert.equal(created.status, 201)
    const id = created.body.id
    const contacted = await req('PATCH', `/api/admin/enquiries/${id}`, { token: admin, body: { status: 'contacted', note: 'Class 9 maths, wants evenings' } })
    assert.equal(contacted.body.status, 'contacted')
    assert.ok(contacted.body.contactedAt)
    assert.ok(contacted.body.notes.some(n => n.text === 'Class 9 maths, wants evenings'))
    assert.equal((await req('PATCH', `/api/admin/enquiries/${id}`, { token: admin, body: { status: 'closed' } })).status, 400)
    const closed = await req('PATCH', `/api/admin/enquiries/${id}`, { token: admin, body: { status: 'closed', closedReason: 'Found a tutor elsewhere' } })
    assert.equal(closed.body.status, 'closed')
    assert.equal(closed.body.closedReason, 'Found a tutor elsewhere')
  })

  test('creating a lead from an enquiry links them and marks it converted', async () => {
    const e = await req('POST', '/api/admin/enquiries', { token: admin, body: { kind: 'parent', phone: '9822200002', name: 'Meena' } })
    const lead = await req('POST', '/api/admin/leads', {
      token: admin,
      body: {
        name: 'Meena', phone: '9822200002', relationship: 'Parent', studentName: 'Kabir', studentClass: '9', board: 'CBSE',
        subjects: ['Mathematics'], mode: 'online', preferredDays: ['mon'], preferredSlots: ['evening'], source: 'website', enquiryId: e.body.id,
      },
    })
    assert.equal(lead.status, 201, JSON.stringify(lead.body))
    const after = (await req('GET', `/api/admin/enquiries/${e.body.id}`, { token: admin })).body
    assert.equal(after.status, 'converted')
    assert.equal(after.leadId, lead.body.id)
    assert.equal(after.parentId, lead.body.parentId)
    assert.equal((await req('PATCH', `/api/admin/enquiries/${e.body.id}`, { token: admin, body: { status: 'new' } })).status, 409)
  })
})

describe('parents, students and requests created by staff', () => {
  test('staff create a parent, add students and a tuition request; the parent can sign in later', async () => {
    const parent = await req('POST', '/api/admin/parents', { token: admin, body: { name: 'Sunita Rao', phone: '9833300001', relationship: 'Parent', pincode: '500016' } })
    assert.equal(parent.status, 201, JSON.stringify(parent.body))
    assert.equal(parent.body.students.length, 0)
    const dup = await req('POST', '/api/admin/parents', { token: admin, body: { name: 'Someone', phone: '9833300001', relationship: 'Parent' } })
    assert.equal(dup.status, 409)

    const withStudent = await req('POST', `/api/admin/parents/${parent.body.id}/students`, { token: admin, body: { studentName: 'Isha', studentClass: '7', board: 'ICSE' } })
    assert.equal(withStudent.status, 201)
    const student = withStudent.body.students[0]

    const lead = await req('POST', `/api/admin/parents/${parent.body.id}/leads`, {
      token: admin,
      body: { studentId: student.id, subjects: ['Science'], mode: 'online', preferredDays: ['sat'], preferredSlots: ['morning'], source: 'whatsapp' },
    })
    assert.equal(lead.status, 201, JSON.stringify(lead.body))
    assert.equal(lead.body.status, 'new')
    assert.equal(lead.body.student.name, 'Isha')
    assert.equal(lead.body.class, '7')

    const other = await req('POST', '/api/admin/parents', { token: admin, body: { name: 'Other', phone: '9833300002', relationship: 'Guardian' } })
    const wrong = await req('POST', `/api/admin/parents/${other.body.id}/leads`, {
      token: admin, body: { studentId: student.id, subjects: ['Science'], mode: 'online', preferredDays: ['sat'], preferredSlots: ['morning'], source: 'bda' },
    })
    assert.equal(wrong.status, 400, "another parent's student is refused")

    const list = await req('GET', '/api/admin/parents?q=Sunita', { token: admin })
    assert.equal(list.body.items[0].students, 1)
    assert.equal(list.body.items[0].openRequests, 1)
    assert.equal(list.body.items[0].createdByStaff, true)

    const edited = await req('PATCH', `/api/admin/parents/${parent.body.id}`, { token: admin, body: { email: 'sunita@example.com' } })
    assert.equal(edited.body.email, 'sunita@example.com')
    assert.equal((await req('PATCH', `/api/admin/parents/${parent.body.id}`, { token: admin, body: { phone: '9000000000' } })).status, 400)

    // The parent signs in with a code to the same number; no password is needed.
    const sent = await req('POST', '/api/auth/send-otp', { body: { phone: '9833300001', role: 'parent', purpose: 'login' } })
    const login = await req('POST', '/api/auth/verify-otp', { body: { phone: '9833300001', role: 'parent', purpose: 'login', code: sent.body.devCode } })
    assert.equal(login.status, 200)
    const overview = await req('GET', '/api/parents/me/overview', { token: login.body.token })
    assert.equal(overview.body.requests.length, 1)
  })
})

describe('tutors created by staff', () => {
  test('a tutor profile needs only the basics, starts pending and links its enquiry', async () => {
    const e = await enquire({ kind: 'tutor', phone: '9844400001', name: 'Farhan', level: 'school' })
    const enquiryId = (await req('GET', '/api/admin/enquiries?q=9844400001', { token: admin })).body.items[0].id
    assert.equal(e.status, 201)
    const tutor = await req('POST', '/api/admin/tutors', {
      token: admin,
      body: { name: 'Farhan Ali', phone: '9844400001', gender: 'Male', subjects: ['Mathematics'], classes: ['8', '9'], modes: ['online'], enquiryId },
    })
    assert.equal(tutor.status, 201, JSON.stringify(tutor.body))
    assert.equal(tutor.body.status, 'pending')
    assert.equal(tutor.body.email, null)
    assert.deepEqual(tutor.body.availability, [])
    assert.equal((await req('GET', `/api/admin/enquiries/${enquiryId}`, { token: admin })).body.tutorId, tutor.body.id)
    assert.equal((await req('POST', '/api/admin/tutors', { token: admin, body: { name: 'Xavier', phone: '9844400001', gender: 'Male', subjects: ['Science'], classes: ['8'], modes: ['online'] } })).status, 409)

    // Staff upload the documents the tutor sent on WhatsApp, then verify as usual.
    for (const [type, buf, name] of [['photo', h.PNG, 'p.png'], ['identity', h.PDF, 'aadhaar.pdf'], ['qualification', h.PDF, 'bsc.pdf']]) {
      const form = new FormData()
      form.append('type', type)
      if (type !== 'photo') form.append('title', `${type} from WhatsApp`)
      form.append('file', new Blob([buf]), name)
      const up = await fetch(`${server.base}/api/admin/tutors/${tutor.body.id}/documents`, { method: 'POST', headers: { Authorization: `Bearer ${admin}` }, body: form })
      assert.equal(up.status, 201)
    }
    const detail = (await req('GET', `/api/admin/tutors/${tutor.body.id}`, { token: admin })).body
    assert.equal(detail.documents.length, 3)
    assert.equal(detail.status, 'documents_submitted')
    const audit = await req('GET', `/api/admin/audit?entity=tutor&entityId=${tutor.body.id}`, { token: admin })
    assert.ok(audit.body.items.some(a => a.action === 'tutor.document.upload' && a.actor === 'admin'))

    // A lead search finds them by name even without an email address.
    const p = await h.registerParent(server, { mode: 'online', address: undefined, pincode: undefined, latitude: undefined, longitude: undefined, consent: { terms: true, communication: true } })
    const search = await req('GET', `/api/admin/leads/${p.lead.id}/tutor-search?q=farhan`, { token: admin })
    assert.equal(search.status, 200)
    assert.equal(search.body.items[0].name, 'Farhan Ali')
  })
})

// Last, because it uses up this connection's allowance.
describe('abuse protection', () => {
  test('the form is rate-limited per connection', async () => {
    let last
    for (let i = 0; i < 25 && (!last || last.status !== 429); i++) last = await enquire({ kind: 'parent', phone: `98111002${String(i).padStart(2, '0')}` })
    assert.equal(last.status, 429)
    assert.equal(last.body.code, 'RATE_LIMITED')
  })
})
