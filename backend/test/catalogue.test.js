const { test, before, after, describe } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const { configureAdminEnv, tempDbPath, startServer, ADMIN_EMAIL, ADMIN_PASSWORD } = require('./helpers')

configureAdminEnv()
const { openDatabase } = require('../src/config/database')
const { createCatalogueRepository } = require('../src/repositories/catalogueRepository')
const { createCatalogueService } = require('../src/services/catalogueService')
const { createApp } = require('../src/app')
const { AppError } = require('../src/errors')

let server
let token
let dbFile

before(async () => {
  dbFile = tempDbPath('catalogue')
  const db = openDatabase(dbFile)
  const service = createCatalogueService({ repo: createCatalogueRepository(db) })
  server = await startServer(createApp({ catalogueService: service, db }))
  const login = await server.request('POST', '/api/admin/auth/login', { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
  token = login.body.token
})

after(async () => { if (server) await server.close() })

const categoryBody = (over = {}) => ({ name: 'School Tuition', shortDescription: 'School subjects', ...over })
const courseBody = (categoryId, over = {}) => ({
  name: 'Class 10 Mathematics', categoryId, shortDescription: 'Maths practice', learningModes: ['home', 'online'], ...over,
})

async function publishedCategory(name = 'Competitive Exams') {
  const c = await server.request('POST', '/api/admin/catalogue/categories', { token, body: categoryBody({ name, shortDescription: 'Exam prep' }) })
  const p = await server.request('POST', `/api/admin/catalogue/categories/${c.body.id}/publish`, { token })
  assert.equal(p.status, 200, JSON.stringify(p.body))
  return p.body
}

describe('admin category and course lifecycle', () => {
  test('creates drafts with server-generated slugs and rejects duplicate slugs', async () => {
    const first = await server.request('POST', '/api/admin/catalogue/categories', { token, body: categoryBody({ name: 'Early Learning Zone' }) })
    assert.equal(first.status, 201)
    assert.equal(first.body.status, 'draft')
    assert.equal(first.body.slug, 'early-learning-zone')
    const dup = await server.request('POST', '/api/admin/catalogue/categories', { token, body: categoryBody({ name: 'Early Learning Zone' }) })
    assert.equal(dup.status, 409)
    assert.equal(dup.body.code, 'SLUG_TAKEN')
  })

  test('course cannot be published while its category is a draft', async () => {
    const cat = await server.request('POST', '/api/admin/catalogue/categories', { token, body: categoryBody({ name: 'Draft Parent' }) })
    const course = await server.request('POST', '/api/admin/catalogue/courses', { token, body: courseBody(cat.body.id, { name: 'Child course' }) })
    assert.equal(course.status, 201)
    const pub = await server.request('POST', `/api/admin/catalogue/courses/${course.body.id}/publish`, { token })
    assert.equal(pub.status, 409)
    assert.equal(pub.body.code, 'CATEGORY_NOT_PUBLISHED')
  })

  test('publish requires complete fields, then course becomes publicly visible', async () => {
    const cat = await publishedCategory('Publish Rules')
    const incomplete = await server.request('POST', '/api/admin/catalogue/courses', { token, body: { name: 'No Description', categoryId: cat.id, learningModes: [] } })
    const fail = await server.request('POST', `/api/admin/catalogue/courses/${incomplete.body.id}/publish`, { token })
    assert.equal(fail.status, 422)
    assert.deepEqual(fail.body.details.sort(), ['learningModes', 'shortDescription'])

    const ok = await server.request('POST', '/api/admin/catalogue/courses', { token, body: courseBody(cat.id, { name: 'Visible Course' }) })
    const pub = await server.request('POST', `/api/admin/catalogue/courses/${ok.body.id}/publish`, { token })
    assert.equal(pub.status, 200)
    assert.equal(pub.body.publiclyVisible, true)
    const pubRead = await server.request('GET', `/api/catalogue/courses/${ok.body.slug}`)
    assert.equal(pubRead.status, 200)
    assert.equal(pubRead.body.category.name, 'Publish Rules')
  })

  test('unpublish hides the course; restore returns it to draft', async () => {
    const cat = await publishedCategory('Unpublish Rules')
    const c = await server.request('POST', '/api/admin/catalogue/courses', { token, body: courseBody(cat.id, { name: 'Toggle Course' }) })
    await server.request('POST', `/api/admin/catalogue/courses/${c.body.id}/publish`, { token })
    await server.request('POST', `/api/admin/catalogue/courses/${c.body.id}/unpublish`, { token })
    assert.equal((await server.request('GET', `/api/catalogue/courses/${c.body.slug}`)).status, 404)
    const archived = await server.request('POST', `/api/admin/catalogue/courses/${c.body.id}/archive`, { token })
    assert.equal(archived.body.status, 'archived')
    const restored = await server.request('POST', `/api/admin/catalogue/courses/${c.body.id}/restore`, { token })
    assert.equal(restored.body.status, 'draft')
  })

  test('archiving a category with active courses is refused; empty category archives', async () => {
    const cat = await publishedCategory('Archive Guard')
    await server.request('POST', '/api/admin/catalogue/courses', { token, body: courseBody(cat.id, { name: 'Blocking course' }) })
    const blocked = await server.request('POST', `/api/admin/catalogue/categories/${cat.id}/archive`, { token })
    assert.equal(blocked.status, 409)
    assert.equal(blocked.body.code, 'CATEGORY_HAS_COURSES')
    assert.equal(blocked.body.details.activeCourses, 1)

    const empty = await server.request('POST', '/api/admin/catalogue/categories', { token, body: categoryBody({ name: 'Empty Archive' }) })
    const done = await server.request('POST', `/api/admin/catalogue/categories/${empty.body.id}/archive`, { token })
    assert.equal(done.status, 200)
    assert.equal(done.body.status, 'archived')
  })

  test('course cannot be moved into an archived category', async () => {
    const cat = await server.request('POST', '/api/admin/catalogue/categories', { token, body: categoryBody({ name: 'Old Category' }) })
    await server.request('POST', `/api/admin/catalogue/categories/${cat.body.id}/archive`, { token })
    const course = await server.request('POST', '/api/admin/catalogue/courses', { token, body: courseBody(cat.body.id, { name: 'Orphan Attempt' }) })
    assert.equal(course.status, 422)
    assert.equal(course.body.code, 'INVALID_REFERENCE')
  })

  test('featured and displayOrder can be changed through PATCH', async () => {
    const cat = await publishedCategory('Ordering')
    const c = await server.request('POST', '/api/admin/catalogue/courses', { token, body: courseBody(cat.id, { name: 'Ordered Course' }) })
    const patched = await server.request('PATCH', `/api/admin/catalogue/courses/${c.body.id}`, { token, body: { featured: true, displayOrder: 7 } })
    assert.equal(patched.status, 200)
    assert.equal(patched.body.featured, true)
    assert.equal(patched.body.displayOrder, 7)
  })
})

describe('validation and restricted fields', () => {
  test('status cannot be set through create or edit', async () => {
    const created = await server.request('POST', '/api/admin/catalogue/categories', { token, body: categoryBody({ name: 'No Status', status: 'published' }) })
    assert.equal(created.status, 400)
    assert.equal(created.body.code, 'VALIDATION_FAILED')
    assert.equal(created.body.details[0].field, 'status')
  })

  test('audit and source fields cannot be injected', async () => {
    const res = await server.request('POST', '/api/admin/catalogue/courses', {
      token, body: courseBody('x', { createdBy: 'mallory', source: 'sample' }),
    })
    assert.equal(res.status, 400)
    const fields = res.body.details.map(d => d.field)
    assert.ok(fields.includes('createdBy'))
    assert.ok(fields.includes('source'))
  })

  test('invalid colours, unknown modes and bad URLs are rejected', async () => {
    const res = await server.request('POST', '/api/admin/catalogue/categories', {
      token, body: categoryBody({ name: 'Bad Values', accentColour: 'red', coverImageUrl: 'javascript:alert(1)' }),
    })
    assert.equal(res.status, 400)
    assert.deepEqual(res.body.details.map(d => d.field).sort(), ['accentColour', 'coverImageUrl'])
  })

  test('learning modes must be home or online', async () => {
    const cat = await publishedCategory('Modes')
    const res = await server.request('POST', '/api/admin/catalogue/courses', { token, body: courseBody(cat.id, { learningModes: ['hybrid'] }) })
    assert.equal(res.status, 400)
    assert.equal(res.body.details[0].field, 'learningModes')
  })

  test('malformed JSON returns a stable error shape', async () => {
    const res = await fetch(`${server.base}/api/admin/catalogue/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: '{"name": ',
    })
    assert.equal(res.status, 400)
    assert.equal((await res.json()).code, 'INVALID_JSON')
  })
})

describe('public read API', () => {
  test('lists only published categories and courses', async () => {
    const cat = await publishedCategory('Public List')
    const draft = await server.request('POST', '/api/admin/catalogue/courses', { token, body: courseBody(cat.id, { name: 'Hidden Draft' }) })
    const pub = await server.request('POST', '/api/admin/catalogue/courses', { token, body: courseBody(cat.id, { name: 'Shown Course' }) })
    await server.request('POST', `/api/admin/catalogue/courses/${pub.body.id}/publish`, { token })

    const list = await server.request('GET', '/api/catalogue/courses?q=&limit=100')
    const names = list.body.items.map(i => i.name)
    assert.ok(names.includes('Shown Course'))
    assert.ok(!names.includes('Hidden Draft'))

    const direct = await server.request('GET', `/api/catalogue/courses/${draft.body.slug}`)
    assert.equal(direct.status, 404)
  })

  test('public responses do not expose audit or source fields', async () => {
    const res = await server.request('GET', '/api/catalogue/courses?limit=5')
    for (const item of res.body.items) {
      assert.equal(item.source, undefined)
      assert.equal(item.createdBy, undefined)
      assert.equal(item.updatedBy, undefined)
    }
  })

  test('filters by category, learning mode and text search', async () => {
    const cat = await publishedCategory('Filter Category')
    const c = await server.request('POST', '/api/admin/catalogue/courses', { token, body: courseBody(cat.id, { name: 'Filterable Physics', learningModes: ['online'], shortDescription: 'Mechanics' }) })
    await server.request('POST', `/api/admin/catalogue/courses/${c.body.id}/publish`, { token })

    const byCat = await server.request('GET', `/api/catalogue/courses?category=${cat.slug}`)
    assert.equal(byCat.body.total, 1)
    const byMode = await server.request('GET', `/api/catalogue/courses?category=${cat.slug}&mode=home`)
    assert.equal(byMode.body.total, 0)
    const bySearch = await server.request('GET', '/api/catalogue/courses?q=mechanic')
    assert.ok(bySearch.body.items.some(i => i.name === 'Filterable Physics'))
  })

  test('unpublishing a category hides its courses from public pages', async () => {
    const cat = await publishedCategory('Hide Category')
    const c = await server.request('POST', '/api/admin/catalogue/courses', { token, body: courseBody(cat.id, { name: 'Hidden With Category' }) })
    await server.request('POST', `/api/admin/catalogue/courses/${c.body.id}/publish`, { token })
    assert.equal((await server.request('GET', `/api/catalogue/courses/${c.body.slug}`)).status, 200)
    await server.request('POST', `/api/admin/catalogue/categories/${cat.id}/unpublish`, { token })
    assert.equal((await server.request('GET', `/api/catalogue/courses/${c.body.slug}`)).status, 404)
    assert.equal((await server.request('GET', `/api/catalogue/categories/${cat.slug}`)).status, 404)
  })

  test('unknown public slugs return 404 with a stable code', async () => {
    const res = await server.request('GET', '/api/catalogue/courses/does-not-exist')
    assert.equal(res.status, 404)
    assert.equal(res.body.code, 'NOT_FOUND')
  })

  test('public list paginates and clamps the limit', async () => {
    const res = await server.request('GET', '/api/catalogue/courses?limit=9999&page=1')
    assert.equal(res.body.limit, 100)
  })
})

describe('persistence across restarts', () => {
  test('records written before a restart are still there afterwards', async () => {
    const file = tempDbPath('restart')
    const first = openDatabase(file)
    const repoA = createCatalogueRepository(first)
    const svcA = createCatalogueService({ repo: repoA })
    const cat = await svcA.createCategory({ name: 'Persisted Category', shortDescription: 'Kept' }, 'admin')
    await svcA.transitionCategory(cat.id, 'publish', 'admin')
    first.close()

    const second = openDatabase(file)
    const svcB = createCatalogueService({ repo: createCatalogueRepository(second) })
    const reread = await svcB.getPublicCategory(cat.slug)
    assert.equal(reread.name, 'Persisted Category')
    second.close()
  })

  test('reopening a database does not re-run applied migrations', () => {
    const file = tempDbPath('migrations')
    openDatabase(file).close()
    const db = openDatabase(file)
    const rows = db.prepare('SELECT version FROM schema_migrations').all()
    assert.deepEqual(rows.map(r => r.version), [1, 2])
    db.close()
  })
})

describe('slug and service rules', () => {
  test('slug uniqueness is enforced by the database as well as the service', async () => {
    const db = openDatabase(':memory:')
    const repo = createCatalogueRepository(db)
    const svc = createCatalogueService({ repo })
    await svc.createCategory({ name: 'Same Name', shortDescription: 'x' }, 'admin')
    await assert.rejects(
      svc.createCategory({ name: 'Same Name', shortDescription: 'x' }, 'admin'),
      err => err instanceof AppError && err.code === 'SLUG_TAKEN'
    )
    await assert.rejects(
      repo.insertCategory({ id: 'raw', slug: 'same-name', name: 'Raw', status: 'draft', source: 'admin', createdAt: 'x', updatedAt: 'x' }),
      /UNIQUE constraint failed/
    )
    db.close()
  })
})

test('a file-backed database is created on disk', () => {
  assert.ok(fs.existsSync(dbFile))
  assert.ok(path.isAbsolute(dbFile))
})
