const { defineModel, types: t } = require('../../db/defineModel')

const STATUSES = ['draft', 'published', 'archived']

module.exports = defineModel('Category', {
  slug: t.requiredString(),
  name: t.requiredString(),
  shortDescription: t.string({ default: '' }),
  description: t.string({ default: '' }),
  iconKey: t.string({ default: '' }),
  accentColour: t.string({ default: '' }),
  coverImageUrl: t.string({ default: '' }),
  displayOrder: t.number({ default: 0 }),
  featured: t.bool(false),
  status: t.enum(STATUSES, { required: true }),
  seoTitle: t.string({ default: '' }),
  seoDescription: t.string({ default: '' }),
  source: t.enum(['admin', 'sample'], { default: 'admin' }),
  createdAt: t.timestamp({ required: true }),
  updatedAt: t.timestamp({ required: true }),
  createdBy: t.string(),
  updatedBy: t.string(),
}, { collection: 'categories', indexes: [[{ slug: 1 }, { unique: true }], [{ status: 1, displayOrder: 1 }]] })
