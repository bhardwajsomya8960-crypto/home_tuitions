const { defineModel, types: t } = require('../../db/defineModel')

module.exports = defineModel('ClassSession', {
  enrolmentId: t.requiredString(),
  scheduledDate: t.requiredString(),
  slot: t.requiredString(),
  status: t.enum(['scheduled', 'completed', 'cancelled'], { required: true }),
  tutorPresent: { type: Boolean, default: null },
  studentPresent: { type: Boolean, default: null },
  notes: t.string(),
  homework: t.string(),
  parentAckAt: t.timestamp(),
  createdAt: t.timestamp({ required: true }),
  updatedAt: t.timestamp({ required: true }),
}, { collection: 'class_sessions', indexes: [[{ enrolmentId: 1, scheduledDate: 1, slot: 1 }, { unique: true }]] })
