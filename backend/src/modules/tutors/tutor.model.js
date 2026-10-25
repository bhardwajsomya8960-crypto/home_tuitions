const { defineModel, types: t } = require('../../db/defineModel')

const TUTOR_STATUSES = ['pending', 'documents_submitted', 'under_review', 'verified', 'active', 'suspended', 'rejected']

// Profiles created by staff may not have email, qualification, address or bio yet.
// availability: weekly hours [{ day, start: 'HH:MM', end: 'HH:MM' }]
// timeOff: holidays and leave [{ from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', reason }]
module.exports = defineModel('Tutor', {
  name: t.requiredString(),
  phone: t.requiredString(),
  email: t.string(),
  gender: t.requiredString(),
  dob: t.string(),
  qualification: t.string(),
  college: t.string(),
  experienceYears: t.number({ default: 0 }),
  subjects: t.strings(),
  classes: t.strings(),
  boards: t.strings(),
  languages: t.strings(),
  modes: t.strings(),
  serviceRadiusKm: t.number({ default: 8 }),
  address: t.string(),
  pincode: t.string(),
  latitude: t.number(),
  longitude: t.number(),
  availability: t.mixed([]),
  timeOff: t.mixed([]),
  feeMin: t.number(),
  feeMax: t.number(),
  bio: t.string(),
  teachingMethod: t.string(),
  achievements: t.string(),
  demoAvailable: t.bool(true),
  acceptingLeads: t.bool(true),
  status: t.enum(TUTOR_STATUSES, { default: 'pending' }),
  statusNotes: t.string(),
  ratingAvg: t.number(),
  ratingCount: t.number({ default: 0 }),
  consent: t.mixed({}),
  createdAt: t.timestamp({ required: true }),
  updatedAt: t.timestamp({ required: true }),
}, { collection: 'tutors', indexes: [[{ phone: 1 }, { unique: true }], [{ status: 1 }]] })

module.exports.TUTOR_STATUSES = TUTOR_STATUSES
