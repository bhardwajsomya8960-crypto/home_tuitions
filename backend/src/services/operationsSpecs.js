// Field specs for operations writes (see validation.js). Unknown fields are rejected.
const M = require('./masters')

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

const parentRegistrationSpec = {
  phoneToken: { type: 'string', required: true, max: 2000 },
  ...parentFields,
  ...studentFields,
  ...requirementFields,
  source: { type: 'enum', allowed: M.LEAD_SOURCES },
  courseId: { type: 'string', max: 64 },
  courseSlug: { type: 'string', max: 80 },
  ...consentField,
}

// A signed-in parent asking for tuition for an existing student or a new one.
const parentRequestSpec = {
  studentId: { type: 'id' },
  studentName: { type: 'string', min: 2, max: 80 },
  studentClass: { type: 'enum', allowed: M.CLASSES },
  board: { type: 'enum', allowed: M.BOARDS },
  school: { type: 'string', max: 120 },
  ...requirementFields,
  locationConsent: { type: 'bool' },
}

const studentSpec = {
  studentName: studentFields.studentName,
  studentClass: studentFields.studentClass,
  board: studentFields.board,
  school: studentFields.school,
}

// A lead entered by staff (BDA) for a parent who called or messaged.
const staffLeadSpec = {
  ...parentFields,
  ...studentFields,
  ...requirementFields,
  source: { type: 'enum', required: true, allowed: M.LEAD_SOURCES },
  note: { type: 'string', max: 1000 },
}

const tutorProfileFields = {
  subjects: { type: 'stringArray', required: true, minItems: 1, maxItems: 15, maxItemLength: 40, allowed: M.SUBJECTS },
  classes: { type: 'stringArray', required: true, minItems: 1, maxItems: 14, maxItemLength: 10, allowed: M.CLASSES },
  boards: { type: 'stringArray', required: true, minItems: 1, maxItems: 5, maxItemLength: 10, allowed: M.BOARDS },
  languages: { type: 'stringArray', required: true, minItems: 1, maxItems: 7, maxItemLength: 20, allowed: M.LANGUAGES },
  modes: { type: 'stringArray', required: true, minItems: 1, maxItems: 2, maxItemLength: 10, allowed: M.TUTOR_MODES },
  serviceRadiusKm: { type: 'number', min: 1, max: 50 },
  availability: { type: 'slots', required: true, minItems: 1, days, slots },
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
}

const rejectOfferSpec = {
  reason: { type: 'enum', required: true, allowed: M.values(M.REJECT_REASONS) },
  comment: { type: 'string', max: 500 },
}

const demoSpec = {
  scheduledAt: { type: 'datetime', required: true },
  durationMinutes: { type: 'int', min: 15, max: 180 },
  mode: { type: 'enum', required: true, allowed: ['home', 'online'] },
  locationNote: { type: 'string', max: 300 },
}

const demoCompleteSpec = {
  outcome: { type: 'enum', allowed: M.values(M.DEMO_OUTCOMES) },
  notes: { type: 'string', max: 1000 },
}

const conversionSpec = {
  plan: { type: 'enum', required: true, allowed: M.PLANS },
  feeAmount: { type: 'int', required: true, min: 1, max: 1000000 },
  startDate: { type: 'date', required: true },
  schedule: { type: 'slots', required: true, minItems: 1, days, slots },
  subjects: { ...requirementFields.subjects, required: false },
}

const attendanceSpec = {
  tutorPresent: { type: 'bool', required: true },
  studentPresent: { type: 'bool', required: true },
  notes: { type: 'string', max: 1000 },
  homework: { type: 'string', max: 1000 },
}

const invoiceSpec = {
  enrolmentId: { type: 'id', required: true },
  amount: { type: 'int', required: true, min: 1, max: 1000000 },
  periodLabel: { type: 'string', required: true, min: 2, max: 60 },
  dueDate: { type: 'date', required: true },
}

const paymentSpec = {
  amount: { type: 'int', required: true, min: 1, max: 1000000 },
  method: { type: 'enum', required: true, allowed: M.PAYMENT_METHODS },
  reference: { type: 'string', max: 100 },
  paidOn: { type: 'date', required: true },
  notes: { type: 'string', max: 500 },
}

const reviewSpec = {
  rating: { type: 'int', required: true, min: 1, max: 5 },
  comment: { type: 'string', max: 1000 },
}

const locationSpec = {
  address: { type: 'string', max: 300 },
  pincode: { type: 'pincode' },
  latitude: { type: 'number', min: -90, max: 90 },
  longitude: { type: 'number', min: -180, max: 180 },
}

module.exports = {
  parentRegistrationSpec, parentRequestSpec, studentSpec, staffLeadSpec,
  tutorRegistrationSpec, tutorUpdateSpec, rejectOfferSpec, demoSpec, demoCompleteSpec,
  conversionSpec, attendanceSpec, invoiceSpec, paymentSpec, reviewSpec, locationSpec,
}
