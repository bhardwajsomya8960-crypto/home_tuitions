// Field specs for writes (see shared/validation.js). Unknown fields are rejected.
const M = require('../../shared/masters')

const rejectOfferSpec = {
  reason: { type: 'enum', required: true, allowed: M.values(M.REJECT_REASONS) },
  comment: { type: 'string', max: 500 },
}

module.exports = { rejectOfferSpec }
