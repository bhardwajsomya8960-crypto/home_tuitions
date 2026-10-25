const { defineModel, types: t } = require('../../db/defineModel')

// A KYC file. The file itself is in S3 (or local disk in development) under `storageKey`.
module.exports = defineModel('TutorDocument', {
  tutorId: t.requiredString(),
  type: t.enum(['photo', 'identity', 'qualification', 'experience'], { required: true }),
  title: t.string(),
  description: t.string(),
  originalName: t.requiredString(),
  mimeType: t.requiredString(),
  sizeBytes: t.number({ required: true }),
  storageKey: t.requiredString(),
  status: t.enum(['submitted', 'accepted', 'rejected'], { default: 'submitted' }),
  rejectReason: t.string(),
  createdAt: t.timestamp({ required: true }),
  reviewedAt: t.timestamp(),
}, { collection: 'tutor_documents', indexes: [[{ tutorId: 1, type: 1 }]] })
