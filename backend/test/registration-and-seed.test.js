const { test, before, after, describe } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync, spawnSync } = require('child_process')
const path = require('path')
const { configureAdminEnv, startServer, tempDbPath, ADMIN_EMAIL, ADMIN_PASSWORD } = require('./helpers')

configureAdminEnv()
const { openDatabase } = require('../src/config/database')
const { createCatalogueRepository } = require('../src/repositories/catalogueRepository')
const { createCatalogueService } = require('../src/services/catalogueService')
const { createApp } = require('../src/app')

let server
let token

const parentPayload = (over = {}) => ({
  name: 'Test Parent', phone: '9876543210', email: 'parent@test.local', relationship: 'Parent',
  studentName: 'Test Student', class: '10', board: 'CBSE', subjects: 'Mathematics',
  address: 'Somewhere', pincode: '110001', latitude: 28.6, longitude: 77.2,
  preferredDays: 'Mon, Wed', preferredTimes: 'Evening', budget: 1500, mode: 'Home',
  ...over,
})

before(async () => {
  const db = openDatabase(':memory:')
  const service = createCatalogueService({ repo: createCatalogueRepository(db) })
  server = await startServer(createApp({ catalogueService: service }))
  // Create one published course through the admin API, using the same code path as production.
  const login = await server.request('POST', '/api/admin/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  token = login.body.token
  const cat = await server.request('POST', '/api/admin/catalogue/categories', { token, body: { name: 'Enquiry Category', shortDescription: 'For enquiries' } })
  await server.request('POST', `/api/admin/catalogue/categories/${cat.body.id}/publish`, { token })
  const course = await server.request('POST', '/api/admin/catalogue/courses', { token, body: { name: 'Enquiry Course', categoryId: cat.body.id, shortDescription: 'Course for enquiry tests', learningModes: ['home'] } })
  await server.request('POST', `/api/admin/catalogue/courses/${course.body.id}/publish`, { token })
  const draft = await server.request('POST', '/api/admin/catalogue/courses', { token, body: { name: 'Draft Enquiry Course', categoryId: cat.body.id, shortDescription: 'Not yet', learningModes: ['home'] } })
  server.publishedCourse = course.body
  server.draftCourse = draft.body
})

after(async () => { if (server) await server.close() })

describe('parent registration compatibility', () => {
  test('registration without course fields still succeeds (backward compatible)', async () => {
    const res = await server.request('POST', '/api/parents/register', { body: parentPayload({ email: 'nocourse@test.local' }) })
    assert.equal(res.status, 201)
    assert.equal(res.body.lead.course_id, null)
    assert.equal(res.body.lead.course_slug, null)
  })

  test('null course fields are treated as absent', async () => {
    const res = await server.request('POST', '/api/parents/register', { body: parentPayload({ courseId: null, courseSlug: null }) })
    assert.equal(res.status, 201)
  })

  test('a published course slug is validated and stored on the lead', async () => {
    const res = await server.request('POST', '/api/parents/register', { body: parentPayload({ courseSlug: server.publishedCourse.slug }) })
    assert.equal(res.status, 201)
    assert.equal(res.body.lead.course_id, server.publishedCourse.id)
    assert.equal(res.body.lead.course_slug, server.publishedCourse.slug)
  })

  test('a published course id is accepted and resolved to its slug', async () => {
    const res = await server.request('POST', '/api/parents/register', { body: parentPayload({ courseId: server.publishedCourse.id }) })
    assert.equal(res.status, 201)
    assert.equal(res.body.lead.course_slug, server.publishedCourse.slug)
  })

  test('an unpublished course is refused before any record is written', async () => {
    const res = await server.request('POST', '/api/parents/register', { body: parentPayload({ courseSlug: server.draftCourse.slug }) })
    assert.equal(res.status, 400)
    assert.equal(res.body.code, 'INVALID_COURSE')
  })

  test('an unknown course is refused', async () => {
    const res = await server.request('POST', '/api/parents/register', { body: parentPayload({ courseSlug: 'no-such-course' }) })
    assert.equal(res.status, 400)
    assert.equal(res.body.code, 'INVALID_COURSE')
  })

  test('mismatched course id and slug are refused', async () => {
    const res = await server.request('POST', '/api/parents/register', {
      body: parentPayload({ courseId: server.publishedCourse.id, courseSlug: 'some-other-course' }),
    })
    assert.equal(res.status, 400)
  })

  test('non-text course fields are refused', async () => {
    const res = await server.request('POST', '/api/parents/register', { body: parentPayload({ courseSlug: 42 }) })
    assert.equal(res.status, 400)
    assert.equal(res.body.code, 'VALIDATION_FAILED')
  })
})

describe('seed script', () => {
  const script = path.join(__dirname, '..', 'scripts', 'seed-catalogue.js')

  test('refuses to run without --sample', () => {
    const result = spawnSync(process.execPath, [script], { env: { ...process.env, CATALOGUE_DB_PATH: tempDbPath('noflag') }, encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Refusing to seed/)
  })

  test('is idempotent and does not overwrite admin edits', () => {
    const file = tempDbPath('seed')
    const env = { ...process.env, CATALOGUE_DB_PATH: file }
    execFileSync(process.execPath, [script, '--sample'], { env })
    const db = openDatabase(file)
    const categoriesAfterFirst = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n
    const coursesAfterFirst = db.prepare('SELECT COUNT(*) AS n FROM courses').get().n
    assert.equal(categoriesAfterFirst, 6)
    assert.equal(coursesAfterFirst, 11)

    // Simulate an administrator editing a sample record
    db.prepare("UPDATE categories SET name = 'Edited by admin' WHERE slug = 'school-tuition'").run()
    db.close()

    const second = execFileSync(process.execPath, [script, '--sample'], { env, encoding: 'utf8' })
    assert.match(second, /0 created/)

    const check = openDatabase(file)
    assert.equal(check.prepare('SELECT COUNT(*) AS n FROM categories').get().n, 6)
    assert.equal(check.prepare('SELECT COUNT(*) AS n FROM courses').get().n, 11)
    assert.equal(check.prepare("SELECT name FROM categories WHERE slug = 'school-tuition'").get().name, 'Edited by admin')
    check.close()
  })

  test('seeded records are marked as sample content', () => {
    const file = tempDbPath('marked')
    execFileSync(process.execPath, [script, '--sample'], { env: { ...process.env, CATALOGUE_DB_PATH: file } })
    const db = openDatabase(file)
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM courses WHERE source != 'sample'").get().n, 0)
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM courses WHERE status = 'draft'").get().n, 1)
    db.close()
  })
})
