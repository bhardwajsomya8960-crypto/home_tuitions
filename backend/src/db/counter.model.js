const { defineModel, types: t } = require('./defineModel')

// Atomic sequences for human-readable numbers (lead codes, invoice numbers). `_id` is the name.
module.exports = defineModel('Counter', { seq: t.number({ default: 0 }) }, { collection: 'counters' })
