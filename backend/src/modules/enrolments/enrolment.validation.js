// Field specs for writes (see shared/validation.js). Unknown fields are rejected.
const M = require('../../shared/masters')
const { requirementFields } = require('../leads/lead.validation')

const days = M.DAYS
const slots = M.values(M.SLOTS)

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

module.exports = { conversionSpec, attendanceSpec }
