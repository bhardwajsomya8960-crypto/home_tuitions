// Field specs for writes (see shared/validation.js). Unknown fields are rejected.
const M = require('../../shared/masters')
const { parentFields, studentFields, requirementFields, consentField } = require('../leads/lead.validation')

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

module.exports = { parentRegistrationSpec, parentRequestSpec, studentSpec }
