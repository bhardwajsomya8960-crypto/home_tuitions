const { defineModel, types: t } = require('../../db/defineModel')

module.exports = defineModel('Invoice', {
  number: t.requiredString(),
  enrolmentId: t.requiredString(),
  parentId: t.requiredString(),
  studentId: t.requiredString(),
  periodLabel: t.requiredString(),
  amount: t.number({ required: true }),
  amountPaid: t.number({ default: 0 }),
  dueDate: t.requiredString(),
  status: t.enum(['pending', 'partial', 'paid', 'void'], { required: true }),
  createdAt: t.timestamp({ required: true }),
  updatedAt: t.timestamp({ required: true }),
}, { collection: 'invoices', indexes: [[{ number: 1 }, { unique: true }], [{ parentId: 1 }], [{ status: 1, dueDate: 1 }]] })
