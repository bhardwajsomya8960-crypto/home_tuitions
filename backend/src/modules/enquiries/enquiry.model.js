const { defineModel, types: t } = require('../../db/defineModel')
const { ENQUIRY_STATUSES, ENQUIRY_LEVELS } = require('../../shared/masters')

// A callback request from the website (no account needed), or one noted by staff. Staff call
// back, then turn it into a parent and tuition request, or a tutor profile.
//   kind: 'parent' (a parent or student looking for tuition) | 'tutor' (wants to teach)
//   notes: staff call notes [{ at, by, text }]
//   parentId / leadId / tutorId: what it became, once converted
module.exports = defineModel('Enquiry', {
  kind: t.enum(['parent', 'tutor'], { required: true }),
  phone: t.requiredString(),
  name: t.string(),
  role: t.enum(['parent', 'student'], { default: null }),
  level: t.enum(ENQUIRY_LEVELS.map(l => l.value), { default: null }),
  message: t.string(),
  courseSlug: t.string(),
  source: t.string({ default: 'website' }),
  status: t.enum(ENQUIRY_STATUSES, { default: 'new' }),
  notes: t.mixed([]),
  repeatCount: t.number({ default: 0 }),
  contactedAt: t.timestamp(),
  closedReason: t.string(),
  parentId: t.string(),
  leadId: t.string(),
  tutorId: t.string(),
  createdAt: t.timestamp({ required: true }),
  updatedAt: t.timestamp({ required: true }),
}, { collection: 'enquiries', indexes: [[{ status: 1, createdAt: -1 }], [{ phone: 1, kind: 1 }]] })
