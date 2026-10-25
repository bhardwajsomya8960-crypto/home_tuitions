// Field specs for writes (see shared/validation.js). Unknown fields are rejected.
const M = require('../../shared/masters')

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

module.exports = { invoiceSpec, paymentSpec }
