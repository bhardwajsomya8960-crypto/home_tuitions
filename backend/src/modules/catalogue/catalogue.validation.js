const MODES = ['home', 'online']

const categorySpec = {
  name: { type: 'string', required: true, min: 2, max: 80 },
  slug: { type: 'slug' },
  shortDescription: { type: 'string', max: 200 },
  description: { type: 'string', max: 5000 },
  iconKey: { type: 'key' },
  accentColour: { type: 'colour' },
  coverImageUrl: { type: 'url' },
  displayOrder: { type: 'int', min: 0, max: 10000 },
  featured: { type: 'bool' },
  seoTitle: { type: 'string', max: 70 },
  seoDescription: { type: 'string', max: 160 },
}

const courseSpec = {
  name: { type: 'string', required: true, min: 2, max: 120 },
  slug: { type: 'slug' },
  categoryId: { type: 'id', required: true },
  shortDescription: { type: 'string', max: 200 },
  description: { type: 'string', max: 5000 },
  levelLabel: { type: 'string', max: 80 },
  applicableFor: { type: 'string', max: 200 },
  subjects: { type: 'stringArray', maxItems: 20, maxItemLength: 60 },
  learningObjectives: { type: 'stringArray', maxItems: 10, maxItemLength: 200 },
  prerequisites: { type: 'stringArray', maxItems: 10, maxItemLength: 200 },
  targetAudience: { type: 'string', max: 200 },
  learningModes: { type: 'stringArray', maxItems: 2, maxItemLength: 10, allowed: MODES },
  coverImageUrl: { type: 'url' },
  displayOrder: { type: 'int', min: 0, max: 10000 },
  featured: { type: 'bool' },
  seoTitle: { type: 'string', max: 70 },
  seoDescription: { type: 'string', max: 160 },
}

module.exports = { categorySpec, courseSpec, MODES }
