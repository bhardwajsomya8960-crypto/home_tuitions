const { defineModel, types: t } = require('../../db/defineModel')

module.exports = defineModel('Demo', {
  leadId: t.requiredString(),
  tutorId: t.requiredString(),
  scheduledAt: t.timestamp({ required: true }),
  durationMin: t.number({ required: true }),
  mode: t.requiredString(),
  locationNote: t.string(),
  status: t.enum(['scheduled', 'completed', 'cancelled', 'no_show_parent', 'no_show_tutor'], { required: true }),
  outcome: t.enum(['interested', 'follow_up', 'not_interested', 'tutor_change'], { default: null }),
  notes: t.string(),
  rescheduleCount: t.number({ default: 0 }),
  createdAt: t.timestamp({ required: true }),
  updatedAt: t.timestamp({ required: true }),
}, { collection: 'demos', indexes: [[{ leadId: 1 }], [{ tutorId: 1 }], [{ status: 1, scheduledAt: 1 }]] })
