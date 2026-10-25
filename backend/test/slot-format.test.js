const { test } = require('node:test')
const assert = require('node:assert/strict')
const { openDatabase } = require('../src/config/database')
const { createOperationsRepository } = require('../src/repositories/operationsRepository')

// Older records stored availability as { mon: ['evening'] } or [{ day, slot }]. They must read
// back as time ranges, which the tutor dashboard and the matching engine expect.
test('legacy availability is read back as time ranges', () => {
  const db = openDatabase(':memory:')
  const repo = createOperationsRepository(db)
  const stamp = new Date().toISOString()
  repo.insert('tutors', {
    id: 't1', name: 'Legacy', phone: '9900200009', email: 'l@example.com', gender: 'Male', qualification: 'Master',
    address: 'x', pincode: '500016', bio: 'b', availability: { mon: ['evening'], sat: ['morning', 'afternoon'] },
    createdAt: stamp, updatedAt: stamp,
  })
  // Morning (8–12) and afternoon (12–4) touch, so they merge into one range.
  assert.deepEqual(repo.get('tutors', 't1').availability, [
    { day: 'mon', start: '16:00', end: '19:00' }, { day: 'sat', start: '08:00', end: '16:00' },
  ])
  repo.update('tutors', 't1', { availability: [{ day: 'tue', slot: 'night' }] })
  assert.deepEqual(repo.get('tutors', 't1').availability, [{ day: 'tue', start: '19:00', end: '21:00' }])
  db.close()
})
