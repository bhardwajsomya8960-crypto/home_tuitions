// Field specs for writes (see shared/validation.js). Unknown fields are rejected.
const M = require('../../shared/masters')
const { consentField } = require('../leads/lead.validation')

const days = M.DAYS

const tutorProfileFields = {
  subjects: { type: 'stringArray', required: true, minItems: 1, maxItems: 15, maxItemLength: 40, allowed: M.SUBJECTS },
  classes: { type: 'stringArray', required: true, minItems: 1, maxItems: 14, maxItemLength: 10, allowed: M.CLASSES },
  boards: { type: 'stringArray', required: true, minItems: 1, maxItems: 5, maxItemLength: 10, allowed: M.BOARDS },
  languages: { type: 'stringArray', required: true, minItems: 1, maxItems: 7, maxItemLength: 20, allowed: M.LANGUAGES },
  modes: { type: 'stringArray', required: true, minItems: 1, maxItems: 2, maxItemLength: 10, allowed: M.TUTOR_MODES },
  serviceRadiusKm: { type: 'number', min: 1, max: 50 },
  availability: { type: 'weeklyHours', required: true, minItems: 1, days },
  feeMin: { type: 'int', min: 0, max: 100000 },
  feeMax: { type: 'int', min: 0, max: 100000 },
  bio: { type: 'string', required: true, min: 50, max: 1000 },
  teachingMethod: { type: 'string', max: 1000 },
  achievements: { type: 'string', max: 1000 },
  demoAvailable: { type: 'bool', required: true },
}

const tutorRegistrationSpec = {
  phoneToken: { type: 'string', required: true, max: 2000 },
  name: { type: 'string', required: true, min: 2, max: 80 },
  phone: { type: 'phone', required: true },
  email: { type: 'email', required: true },
  gender: { type: 'enum', required: true, allowed: M.GENDERS },
  dob: { type: 'date' },
  qualification: { type: 'enum', required: true, allowed: M.QUALIFICATIONS },
  college: { type: 'string', max: 120 },
  experienceYears: { type: 'int', required: true, min: 0, max: 50 },
  address: { type: 'string', required: true, min: 5, max: 300 },
  pincode: { type: 'pincode', required: true },
  latitude: { type: 'number', min: -90, max: 90 },
  longitude: { type: 'number', min: -180, max: 180 },
  ...tutorProfileFields,
  ...consentField,
}

// What a tutor can change about themselves after registering.
const tutorUpdateSpec = {
  ...tutorProfileFields,
  acceptingLeads: { type: 'bool' },
  timeOff: { type: 'timeOff' },
}

module.exports = { tutorProfileFields, tutorRegistrationSpec, tutorUpdateSpec }
