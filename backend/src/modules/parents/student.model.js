const { defineModel, types: t } = require('../../db/defineModel')

module.exports = defineModel('Student', {
  parentId: t.requiredString(),
  name: t.requiredString(),
  class: t.requiredString(),
  board: t.requiredString(),
  school: t.string(),
  subjects: t.strings(),
  createdAt: t.timestamp({ required: true }),
  updatedAt: t.timestamp({ required: true }),
}, { collection: 'students', indexes: [[{ parentId: 1 }]] })
