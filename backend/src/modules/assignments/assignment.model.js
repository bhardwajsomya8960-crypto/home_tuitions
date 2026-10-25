const { defineModel, types: t } = require('../../db/defineModel')

const ASSIGNMENT_STATUSES = ['offered', 'accepted', 'rejected', 'expired', 'unavailable', 'withdrawn', 'confirmed', 'released']

// An offer of a lead to a tutor, and what happened to it. Never deleted (business rule 7).
module.exports = defineModel('Assignment', {
  leadId: t.requiredString(),
  tutorId: t.requiredString(),
  matchRunId: t.string(),
  rank: t.number(),
  score: t.number({ required: true }),
  distanceKm: t.number(),
  factors: t.mixed({}),
  reasons: t.mixed([]),
  status: t.enum(ASSIGNMENT_STATUSES, { required: true }),
  offeredAt: t.timestamp({ required: true }),
  expiresAt: t.timestamp({ required: true }),
  respondedAt: t.timestamp(),
  rejectReason: t.string(),
  rejectComment: t.string(),
  infoRequest: t.string(),
  confirmedAt: t.timestamp(),
  createdAt: t.timestamp({ required: true }),
  updatedAt: t.timestamp({ required: true }),
}, {
  collection: 'assignments',
  indexes: [[{ leadId: 1, status: 1 }], [{ tutorId: 1, status: 1 }], [{ status: 1, expiresAt: 1 }]],
})
