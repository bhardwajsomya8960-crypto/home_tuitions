// Field specs for writes (see shared/validation.js). Unknown fields are rejected.
const M = require('../../shared/masters')

const days = M.DAYS
const slots = M.values(M.SLOTS)

const parentFields = {
  name: { type: 'string', required: true, min: 2, max: 80 },
  phone: { type: 'phone', required: true },
  email: { type: 'email' },
  relationship: { type: 'enum', required: true, allowed: M.RELATIONSHIPS },
}

const studentFields = {
  studentName: { type: 'string', required: true, min: 2, max: 80 },
  studentClass: { type: 'enum', required: true, allowed: M.CLASSES },
  board: { type: 'enum', required: true, allowed: M.BOARDS },
  school: { type: 'string', max: 120 },
}

// The tuition requirement. Address and pincode are required for home and hybrid (checked in the service).
const requirementFields = {
  subjects: { type: 'stringArray', required: true, minItems: 1, maxItems: 10, maxItemLength: 40, allowed: M.SUBJECTS },
  mode: { type: 'enum', required: true, allowed: M.LEAD_MODES },
  address: { type: 'string', max: 300 },
  pincode: { type: 'pincode' },
  latitude: { type: 'number', min: -90, max: 90 },
  longitude: { type: 'number', min: -180, max: 180 },
  preferredDays: { type: 'stringArray', required: true, minItems: 1, maxItems: 7, maxItemLength: 3, allowed: days },
  preferredSlots: { type: 'stringArray', required: true, minItems: 1, maxItems: 5, maxItemLength: 20, allowed: slots },
  prefGender: { type: 'enum', allowed: ['Female', 'Male', 'No preference'] },
  prefLanguages: { type: 'stringArray', maxItems: 5, maxItemLength: 20, allowed: M.LANGUAGES },
  budgetRange: { type: 'enum', allowed: M.values(M.BUDGET_RANGES) },
  startDate: { type: 'date' },
  urgency: { type: 'enum', allowed: M.values(M.URGENCY) },
  specialRequirements: { type: 'string', max: 1000 },
}

const consentField = { consent: { type: 'consent' } }

// A lead entered by staff (BDA) for a parent who called or messaged.
const staffLeadSpec = {
  ...parentFields,
  ...studentFields,
  ...requirementFields,
  source: { type: 'enum', required: true, allowed: M.LEAD_SOURCES },
  note: { type: 'string', max: 1000 },
  // The website enquiry this came from, if any; it is marked as converted.
  enquiryId: { type: 'id' },
}

const locationSpec = {
  address: { type: 'string', max: 300 },
  pincode: { type: 'pincode' },
  latitude: { type: 'number', min: -90, max: 90 },
  longitude: { type: 'number', min: -180, max: 180 },
}

// Staff adding a tuition request for a parent who already has an account.
const parentLeadSpec = {
  studentId: { type: 'id', required: true },
  ...requirementFields,
  source: { type: 'enum', required: true, allowed: M.LEAD_SOURCES },
  note: { type: 'string', max: 1000 },
  enquiryId: { type: 'id' },
}

module.exports = { parentFields, studentFields, requirementFields, consentField, staffLeadSpec, parentLeadSpec, locationSpec }
