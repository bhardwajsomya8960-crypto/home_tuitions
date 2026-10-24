const { test, before, after, describe } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync, spawnSync } = require('child_process')
const path = require('path')
const { configureAdminEnv, startServer, tempDbPath, ADMIN_EMAIL, ADMIN_PASSWORD, verifiedPhone, nextPhone, parentBody } = require('./helpers')

configureAdminEnv()
const { openDatabase } = require('../src/config/database')
const { createCatalogueRepository } = require('../src/repositories/catalogueRepository')
const { createCatalogueService } = require('../src/services/catalogueService')
const { createApp } = require('../src/app')

let server
let token

// Each registration needs its own verified number.
async function register(over = {}) {
  const phone = nextPhone()
  const phoneToken = await verifiedPhone(server, phone, 'parent')
  return server.request('POST', '/api/parents/register', { body: parentBody({ phone, phoneToken, ...over }) })
}

before(async () => {
  const db = openDatabase(':memory:')
  const service = createCatalogueService({ repo: createCatalogueRepository(db) })
  server = await startServer(createApp({ catalogueService: service, db }))
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

describe('parent registration with course context', () => {
  test('registration without course fields succeeds', async () => {
    const res = await register()
    assert.equal(res.status, 201)
    const lead = server.app.locals.operationsService.ctx.repo.get('leads', res.body.lead.id)
    assert.equal(lead.courseId, null)
    assert.equal(lead.courseSlug, null)
  })

  test('a published course slug is validated and stored on the lead', async () => {
    const res = await register({ courseSlug: server.publishedCourse.slug })
    assert.equal(res.status, 201)
    const lead = server.app.locals.operationsService.ctx.repo.get('leads', res.body.lead.id)
    assert.equal(lead.courseId, server.publishedCourse.id)
    assert.equal(lead.courseSlug, server.publishedCourse.slug)
  })

  test('a published course id is accepted and resolved to its slug', async () => {
    const res = await register({ courseId: server.publishedCourse.id })
    assert.equal(res.status, 201)
    assert.equal(server.app.locals.operationsService.ctx.repo.get('leads', res.body.lead.id).courseSlug, server.publishedCourse.slug)
  })

  test('an unpublished course is refused before any record is written', async () => {
    const before = server.app.locals.operationsService.ctx.repo.count('parents')
    const res = await register({ courseSlug: server.draftCourse.slug })
    assert.equal(res.status, 400)
    assert.equal(res.body.code, 'INVALID_COURSE')
    assert.equal(server.app.locals.operationsService.ctx.repo.count('parents'), before)
  })

  test('an unknown course is refused', async () => {
    const res = await register({ courseSlug: 'no-such-course' })
    assert.equal(res.status, 400)
    assert.equal(res.body.code, 'INVALID_COURSE')
  })

  test('mismatched course id and slug are refused', async () => {
    const res = await register({ courseId: server.publishedCourse.id, courseSlug: 'some-other-course' })
    assert.equal(res.status, 400)
  })

  test('non-text course fields are refused', async () => {
    const res = await register({ courseSlug: 42 })
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
