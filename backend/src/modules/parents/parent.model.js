const { defineModel, types: t } = require('../../db/defineModel')

// A parent or guardian account. Created by the website enquiry form or by staff.
module.exports = defineModel('Parent', {
  name: t.requiredString(),
  phone: t.requiredString(),
  email: t.string(),
  relationship: t.requiredString(),
  address: t.string(),
  pincode: t.string(),
  latitude: t.number(),
  longitude: t.number(),
  consent: t.mixed({}),
  status: t.enum(['active', 'inactive'], { default: 'active' }),
  createdAt: t.timestamp({ required: true }),
  updatedAt: t.timestamp({ required: true }),
}, { collection: 'parents', indexes: [[{ phone: 1 }, { unique: true }]] })
