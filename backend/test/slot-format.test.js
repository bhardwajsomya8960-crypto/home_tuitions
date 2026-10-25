const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { connectTestDb, dropTestDb } = require('./helpers')
const { createRepository } = require('../src/db/repository')

before(() => connectTestDb('slot_format'))
after(() => dropTestDb())

// Older records stored availability as { mon: ['evening'] } or [{ day, slot }]. They must read
// back as time ranges, which the tutor dashboard and the matching engine expect.
test('legacy availability is read back as time ranges', async () => {
  const repo = createRepository()
  const stamp = new Date().toISOString()
  await repo.insert('Tutor', {
    id: 't1', name: 'Legacy', phone: '9900200009', email: 'l@example.com', gender: 'Male', qualification: 'Master',
    address: 'x', pincode: '500016', bio: 'b', availability: { mon: ['evening'], sat: ['morning', 'afternoon'] },
    createdAt: stamp, updatedAt: stamp,
  })
  // Morning (8–12) and afternoon (12–4) touch, so they merge into one range.
  assert.deepEqual((await repo.get('Tutor', 't1')).availability, [
    { day: 'mon', start: '16:00', end: '19:00' }, { day: 'sat', start: '08:00', end: '16:00' },
  ])
  await repo.update('Tutor', 't1', { availability: [{ day: 'tue', slot: 'night' }] })
  assert.deepEqual((await repo.get('Tutor', 't1')).availability, [{ day: 'tue', start: '19:00', end: '21:00' }])
})
