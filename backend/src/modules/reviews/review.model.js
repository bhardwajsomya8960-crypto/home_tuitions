const { defineModel, types: t } = require('../../db/defineModel')

// A parent's rating of a tutor, once after the demo and once during tuition.
module.exports = defineModel('Review', {
  parentId: t.requiredString(),
  tutorId: t.requiredString(),
  leadId: t.requiredString(),
  stage: t.enum(['demo', 'ongoing'], { required: true }),
  rating: t.number({ required: true, min: 1, max: 5 }),
  comment: t.string(),
  createdAt: t.timestamp({ required: true }),
}, { collection: 'reviews', indexes: [[{ parentId: 1, leadId: 1, stage: 1 }, { unique: true }], [{ tutorId: 1 }]] })
