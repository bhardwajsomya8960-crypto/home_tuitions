// Field specs for writes (see shared/validation.js). Unknown fields are rejected.
const M = require('../../shared/masters')

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

module.exports = { demoSpec, demoCompleteSpec }
