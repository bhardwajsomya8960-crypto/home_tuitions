const { test } = require('node:test')
const assert = require('node:assert/strict')
const { openDatabase } = require('../src/config/database')
const { createOperationsRepository } = require('../src/repositories/operationsRepository')

// Older seed data stored availability as { mon: ['evening'] }. It must read back as a list,
// because the tutor dashboard and the matching engine both expect [{ day, slot }].
test('legacy object-shaped availability is read back as a slot list', () => {
  const db = openDatabase(':memory:')
  const repo = createOperationsRepository(db)
  const stamp = new Date().toISOString()
  repo.insert('tutors', {
    id: 't1', name: 'Legacy', phone: '9900200009', email: 'l@example.com', gender: 'Male', qualification: 'Master',
    address: 'x', pincode: '500016', bio: 'b', availability: { mon: ['evening'], sat: ['morning', 'afternoon'] },
    createdAt: stamp, updatedAt: stamp,
  })
  assert.deepEqual(repo.get('tutors', 't1').availability, [
    { day: 'mon', slot: 'evening' }, { day: 'sat', slot: 'morning' }, { day: 'sat', slot: 'afternoon' },
  ])
  db.close()
})
