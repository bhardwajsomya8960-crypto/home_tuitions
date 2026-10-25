// Field specs for writes (see shared/validation.js). Unknown fields are rejected.

const reviewSpec = {
  rating: { type: 'int', required: true, min: 1, max: 5 },
  comment: { type: 'string', max: 1000 },
}

module.exports = { reviewSpec }
