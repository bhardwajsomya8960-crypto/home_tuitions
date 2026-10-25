const { defineModel, types: t } = require('../../db/defineModel')

// Admin-editable settings, one document per key (for example 'matching'). `_id` is the key.
module.exports = defineModel('Setting', {
  value: t.mixed({}),
  updatedAt: t.timestamp({ required: true }),
  updatedBy: t.requiredString(),
}, { collection: 'settings' })
