const { defineModel, types: t } = require('../../db/defineModel')

// Timeline entry for a lead: status changes, notes, offers, demos.
module.exports = defineModel('LeadEvent', {
  leadId: t.requiredString(),
  type: t.requiredString(),
  fromStatus: t.string(),
  toStatus: t.string(),
  actor: t.requiredString(),
  note: t.string(),
  createdAt: t.timestamp({ required: true }),
}, { collection: 'lead_events', indexes: [[{ leadId: 1, createdAt: 1 }], [{ type: 1 }]] })
