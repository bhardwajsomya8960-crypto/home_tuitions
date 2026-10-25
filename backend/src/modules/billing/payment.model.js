const { defineModel, types: t } = require('../../db/defineModel')

module.exports = defineModel('Payment', {
  invoiceId: t.requiredString(),
  amount: t.number({ required: true }),
  method: t.requiredString(),
  reference: t.string(),
  paidOn: t.requiredString(),
  notes: t.string(),
  recordedBy: t.requiredString(),
  createdAt: t.timestamp({ required: true }),
}, { collection: 'payments', indexes: [[{ invoiceId: 1 }]] })
