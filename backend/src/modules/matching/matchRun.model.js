const { defineModel, types: t } = require('../../db/defineModel')

// A stored matching result: the settings used and every eligible tutor with score and reasons.
module.exports = defineModel('MatchRun', {
  leadId: t.requiredString(),
  settings: t.mixed({}),
  results: t.mixed([]),
  excludedCount: t.number({ default: 0 }),
  createdBy: t.requiredString(),
  createdAt: t.timestamp({ required: true }),
}, { collection: 'match_runs', indexes: [[{ leadId: 1, createdAt: -1 }]] })
