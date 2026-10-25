const { defineModel, types: t } = require('../../db/defineModel')

// Ongoing tuition after a successful demo. schedule: [{ day, slot }]
module.exports = defineModel('Enrolment', {
  leadId: t.requiredString(),
  studentId: t.requiredString(),
  parentId: t.requiredString(),
  tutorId: t.requiredString(),
  subjects: t.strings(),
  mode: t.requiredString(),
  plan: t.enum(['one_time', 'monthly', 'quarterly', 'custom'], { required: true }),
  feeAmount: t.number({ required: true }),
  startDate: t.requiredString(),
  schedule: t.mixed([]),
  status: t.enum(['active', 'paused', 'completed', 'cancelled'], { required: true }),
  createdAt: t.timestamp({ required: true }),
  updatedAt: t.timestamp({ required: true }),
}, { collection: 'enrolments', indexes: [[{ tutorId: 1, status: 1 }], [{ parentId: 1 }], [{ leadId: 1 }]] })
