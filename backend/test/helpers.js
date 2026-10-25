const bcrypt = require('bcryptjs')
const os = require('os')
const path = require('path')
const fs = require('fs')

const ADMIN_EMAIL = 'admin@test.local'
const ADMIN_PASSWORD = 'correct-horse-battery'
const ADMIN_SECRET = 'a'.repeat(40)

// Sets admin configuration for the test process. Must run before the app is required.
function configureAdminEnv() {
  process.env.ADMIN_EMAIL = ADMIN_EMAIL
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 4)
  process.env.ADMIN_JWT_SECRET = ADMIN_SECRET
  process.env.ADMIN_TOKEN_TTL = '1h'
  process.env.JWT_SECRET = 'b'.repeat(40)
  process.env.OTP_DEV_ECHO = 'true'
  process.env.UPLOADS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'uploads-test-'))
}

function tempDbPath(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalogue-test-'))
  return path.join(dir, `${name}.sqlite`)
}

// Starts the app on an ephemeral port and returns a small JSON client.
async function startServer(app) {
  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s))
  })
  const { port } = server.address()
  const base = `http://127.0.0.1:${port}`

  async function request(method, url, { body, token, headers = {} } = {}) {
    const res = await fetch(base + url, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    let json = null
    try { json = text ? JSON.parse(text) : null } catch { json = text }
    return { status: res.status, body: json, headers: res.headers }
  }

  return { app, base, request, close: () => new Promise(r => server.close(r)) }
}

// Builds an app on a fresh in-memory database and starts it.
async function startTestServer(options = {}) {
  const { openDatabase } = require('../src/config/database')
  const { createApp } = require('../src/app')
  const db = openDatabase(':memory:')
  const server = await startServer(createApp({ db, ...options }))
  server.db = db
  server.ops = server.app.locals.operationsService
  return server
}

async function adminToken(server) {
  const res = await server.request('POST', '/api/admin/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  return res.body.token
}

// Runs the register-purpose OTP flow and returns the phone token.
async function verifiedPhone(server, phone, role) {
  const sent = await server.request('POST', '/api/auth/send-otp', { body: { phone, role, purpose: 'register' } })
  if (sent.status !== 200) throw new Error(`send-otp failed: ${JSON.stringify(sent.body)}`)
  const verified = await server.request('POST', '/api/auth/verify-otp', { body: { phone, role, purpose: 'register', code: sent.body.devCode } })
  if (verified.status !== 200) throw new Error(`verify-otp failed: ${JSON.stringify(verified.body)}`)
  return verified.body.phoneToken
}

let phoneCounter = 0
const nextPhone = () => `9${String(100000000 + (phoneCounter++)).slice(-9)}`

// Hyderabad test locations (blueprint §31: test data across localities).
const PLACES = {
  ameerpet: { latitude: 17.4375, longitude: 78.4483, pincode: '500016' },
  begumpet: { latitude: 17.4440, longitude: 78.4620, pincode: '500016' }, // ~1.6 km from Ameerpet
  banjaraHills: { latitude: 17.4126, longitude: 78.4392, pincode: '500034' }, // ~2.9 km
  kukatpally: { latitude: 17.4849, longitude: 78.4138, pincode: '500072' }, // ~6.4 km
  secunderabad: { latitude: 17.4399, longitude: 78.4983, pincode: '500003' }, // ~5.3 km
  gachibowli: { latitude: 17.4401, longitude: 78.3489, pincode: '500032' }, // ~10.5 km
}

const parentBody = (over = {}) => ({
  name: 'Test Parent', email: 'parent@test.local', relationship: 'Parent',
  studentName: 'Test Student', studentClass: '8', board: 'CBSE', subjects: ['Mathematics'],
  mode: 'home', address: '12 Test Street, Ameerpet', ...PLACES.ameerpet,
  preferredDays: ['tue', 'thu'], preferredSlots: ['evening'], budgetRange: '2000_4000',
  consent: { terms: true, communication: true, location: true },
  ...over,
})

const tutorBody = (over = {}) => ({
  name: 'Test Tutor', email: 'tutor@test.local', gender: 'Female', qualification: 'Master', experienceYears: 5,
  address: '1 Tutor Lane, Begumpet', ...PLACES.begumpet,
  subjects: ['Mathematics', 'Science'], classes: ['7', '8', '9'], boards: ['CBSE'], languages: ['English', 'Hindi'],
  modes: ['home', 'online'], serviceRadiusKm: 8,
  availability: [{ day: 'tue', start: '16:00', end: '19:00' }, { day: 'thu', start: '16:00', end: '19:00' }, { day: 'sat', start: '08:00', end: '12:00' }],
  feeMin: 2500, feeMax: 3500,
  bio: 'I have taught middle-school mathematics for five years and focus on building strong fundamentals.',
  demoAvailable: true, consent: { terms: true, communication: true, location: true },
  ...over,
})

async function registerParent(server, over = {}) {
  const phone = over.phone || nextPhone()
  const phoneToken = await verifiedPhone(server, phone, 'parent')
  const res = await server.request('POST', '/api/parents/register', { body: parentBody({ phone, phoneToken, ...over }) })
  if (res.status !== 201) throw new Error(`parent registration failed: ${JSON.stringify(res.body)}`)
  return { ...res.body, phone }
}

async function registerTutor(server, over = {}) {
  const phone = over.phone || nextPhone()
  const phoneToken = await verifiedPhone(server, phone, 'tutor')
  const res = await server.request('POST', '/api/tutors/register', { body: tutorBody({ phone, phoneToken, ...over }) })
  if (res.status !== 201) throw new Error(`tutor registration failed: ${JSON.stringify(res.body)}`)
  return { ...res.body, phone }
}

// Uploads the required documents through the API, then accepts, verifies and activates.
const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex')
const PDF = Buffer.from('%PDF-1.4\n%test\n')

async function uploadDocument(server, token, type, buffer, name, details = { title: `My ${type}` }) {
  const form = new FormData()
  form.append('type', type)
  for (const [key, value] of Object.entries(details)) form.append(key, value)
  form.append('file', new Blob([buffer]), name)
  const res = await fetch(`${server.base}/api/tutors/me/documents`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
  return { status: res.status, body: await res.json() }
}

async function activateTutor(server, admin, tutor) {
  for (const [type, buf, name] of [['photo', PNG, 'me.png'], ['identity', PDF, 'id.pdf'], ['qualification', PDF, 'degree.pdf']]) {
    const up = await uploadDocument(server, tutor.token, type, buf, name)
    if (up.status !== 201) throw new Error(`upload failed: ${JSON.stringify(up.body)}`)
    await server.request('POST', `/api/admin/documents/${up.body.id}/review`, { token: admin, body: { status: 'accepted' } })
  }
  for (const action of ['verify', 'activate']) {
    const res = await server.request('POST', `/api/admin/tutors/${tutor.tutor.id}/actions`, { token: admin, body: { action } })
    if (res.status !== 200) throw new Error(`${action} failed: ${JSON.stringify(res.body)}`)
  }
}

module.exports = {
  ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SECRET, configureAdminEnv, tempDbPath, startServer, startTestServer,
  adminToken, verifiedPhone, nextPhone, PLACES, parentBody, tutorBody, registerParent, registerTutor,
  uploadDocument, activateTutor, PNG, PDF,
}
