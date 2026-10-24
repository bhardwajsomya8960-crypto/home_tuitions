// Seeds sample catalogue content. Safe to run repeatedly:
// existing slugs are skipped and never overwritten, so admin edits are preserved.
//
//   node scripts/seed-catalogue.js --sample
//
// Refuses to run without --sample so sample content is never added by accident.
require('../src/config/loadEnv').loadEnv()

const { getDatabase } = require('../src/config/database')
const { createCatalogueRepository } = require('../src/repositories/catalogueRepository')
const { validateFields, slugify } = require('../src/services/validation')
const { categorySpec, courseSpec } = require('../src/services/catalogueSpecs')
const { categories, courses } = require('../src/seed/catalogueSeed')
const crypto = require('crypto')

if (!process.argv.includes('--sample')) {
  console.error('Refusing to seed: pass --sample to add sample catalogue content.')
  process.exit(1)
}

async function main() {
  const repo = createCatalogueRepository(getDatabase())
  const stamp = new Date().toISOString()
  const idBySlug = {}
  let created = 0
  let skipped = 0

  for (const item of categories) {
    const { slug, ...fields } = item
    const { value, errors } = validateFields({ ...fields, slug }, categorySpec)
    if (errors.length) throw new Error(`Invalid seed category ${slug}: ${JSON.stringify(errors)}`)
    const existing = await repo.getCategory({ slug })
    if (existing) { idBySlug[slug] = existing.id; skipped++; continue }
    const id = crypto.randomUUID()
    idBySlug[slug] = id
    await repo.insertCategory({
      id, shortDescription: '', description: '', iconKey: '', accentColour: '', coverImageUrl: '',
      displayOrder: 0, featured: false, seoTitle: '', seoDescription: '',
      ...value, slug, status: 'published', source: 'sample',
      createdAt: stamp, updatedAt: stamp, createdBy: 'seed', updatedBy: 'seed',
    })
    created++
  }

  for (const item of courses) {
    const { category, status, ...fields } = item
    const { value, errors } = validateFields({ ...fields, categoryId: 'placeholder' }, courseSpec, { partial: false })
    const real = { ...value, categoryId: idBySlug[category] }
    if (errors.some(e => e.field !== 'categoryId')) throw new Error(`Invalid seed course ${item.slug}: ${JSON.stringify(errors)}`)
    if (!real.categoryId) throw new Error(`Seed course ${item.slug} references unknown category ${category}`)
    if (await repo.getCourse({ slug: item.slug })) { skipped++; continue }
    await repo.insertCourse({
      id: crypto.randomUUID(), shortDescription: '', description: '', levelLabel: '', applicableFor: '', targetAudience: '',
      subjects: [], learningObjectives: [], prerequisites: [], learningModes: [], coverImageUrl: '',
      displayOrder: 0, featured: false, seoTitle: '', seoDescription: '',
      ...real, slug: item.slug, status, source: 'sample',
      createdAt: stamp, updatedAt: stamp, createdBy: 'seed', updatedBy: 'seed',
    })
    created++
  }

  console.log(`Catalogue seed complete: ${created} created, ${skipped} already present (left unchanged).`)
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
})
