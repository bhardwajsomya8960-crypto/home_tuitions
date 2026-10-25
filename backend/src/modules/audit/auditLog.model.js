const { defineModel, types: t } = require('../../db/defineModel')

// Append-only record of every write. actor: 'admin', 'parent:<id>', 'tutor:<id>' or 'system'.
module.exports = defineModel('AuditLog', {
  actor: t.requiredString(),
  action: t.requiredString(),
  entity: t.requiredString(),
  entityId: t.string(),
  details: t.mixed(null),
  createdAt: t.timestamp({ required: true }),
}, { collection: 'audit_log', indexes: [[{ entity: 1, entityId: 1 }], [{ createdAt: -1 }]] })
