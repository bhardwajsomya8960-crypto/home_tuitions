const { test, before, after, describe } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync, spawnSync } = require('child_process')
const path = require('path')
const { configureAdminEnv, startTestServer, ADMIN_EMAIL, ADMIN_PASSWORD, verifiedPhone, nextPhone, parentBody } = require('./helpers')

configureAdminEnv()
const { mongoose } = require('../src/db/connection')

let server
let token

// Each registration needs its own verified number.
async function register(over = {}) {
  const phone = nextPhone()
  const phoneToken = await verifiedPhone(server, phone, 'parent')
  return server.request('POST', '/api/parents/register', { body: parentBody({ phone, phoneToken, ...over }) })
}

before(async () => {
  server = await startTestServer('registration')
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
    const lead = (await server.repo.get('Lead', res.body.lead.id))
    assert.equal(lead.courseId, null)
    assert.equal(lead.courseSlug, null)
  })

  test('a published course slug is validated and stored on the lead', async () => {
    const res = await register({ courseSlug: server.publishedCourse.slug })
    assert.equal(res.status, 201)
    const lead = (await server.repo.get('Lead', res.body.lead.id))
    assert.equal(lead.courseId, server.publishedCourse.id)
    assert.equal(lead.courseSlug, server.publishedCourse.slug)
  })

  test('a published course id is accepted and resolved to its slug', async () => {
    const res = await register({ courseId: server.publishedCourse.id })
    assert.equal(res.status, 201)
    assert.equal((await server.repo.get('Lead', res.body.lead.id)).courseSlug, server.publishedCourse.slug)
  })

  test('an unpublished course is refused before any record is written', async () => {
    const before = (await server.repo.count('Parent'))
    const res = await register({ courseSlug: server.draftCourse.slug })
    assert.equal(res.status, 400)
    assert.equal(res.body.code, 'INVALID_COURSE')
    assert.equal((await server.repo.count('Parent')), before)
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
  // The script runs as its own process against a separate database on the same server.
  const host = () => mongoose.connection.getClient().options.hosts.map(h => `${h.host}:${h.port}`).join(',')
  const seedDb = name => {
    const dbName = `${mongoose.connection.name}_${name}`.slice(0, 60)
    return { dbName, env: { ...process.env, MONGODB_URI: `mongodb://${host()}/${dbName}?directConnection=true` }, db: () => mongoose.connection.useDb(dbName, { useCache: true }).db }
  }

  test('refuses to run without --sample', () => {
    const result = spawnSync(process.execPath, [script], { env: seedDb('noflag').env, encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Refusing to seed/)
  })

  test('is idempotent and does not overwrite admin edits', async () => {
    const target = seedDb('seed')
    execFileSync(process.execPath, [script, '--sample'], { env: target.env })
    const db = target.db()
    assert.equal(await db.collection('categories').countDocuments(), 6)
    assert.equal(await db.collection('courses').countDocuments(), 11)

    // Simulate an administrator editing a sample record
    await db.collection('categories').updateOne({ slug: 'school-tuition' }, { $set: { name: 'Edited by admin' } })

    const second = execFileSync(process.execPath, [script, '--sample'], { env: target.env, encoding: 'utf8' })
    assert.match(second, /0 created/)
    assert.equal(await db.collection('categories').countDocuments(), 6)
    assert.equal(await db.collection('courses').countDocuments(), 11)
    assert.equal((await db.collection('categories').findOne({ slug: 'school-tuition' })).name, 'Edited by admin')
    await db.dropDatabase()
  })

  test('seeded records are marked as sample content', async () => {
    const target = seedDb('marked')
    execFileSync(process.execPath, [script, '--sample'], { env: target.env })
    const db = target.db()
    assert.equal(await db.collection('courses').countDocuments({ source: { $ne: 'sample' } }), 0)
    assert.equal(await db.collection('courses').countDocuments({ status: 'draft' }), 1)
    await db.dropDatabase()
  })
})
