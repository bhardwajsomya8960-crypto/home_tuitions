// Catalogue storage (categories and courses) on MongoDB.
//
// The service depends only on these methods:
//   findCategories({ publicOnly, status, q, featured, limit, offset })  -> { items, total }
//   getCategory({ id, slug })                                           -> category | null
//   insertCategory(record) / updateCategory(id, fields)                 -> category
//   findCourses({ publicOnly, status, categoryId, categorySlug, mode, q, featured, limit, offset }) -> { items, total }
//   getCourse({ id, slug, publicOnly })                                 -> course | null
//   insertCourse(record) / updateCourse(id, fields)                     -> course
//   countCoursesInCategory(categoryId, { excludeArchived })             -> number
//   slugTaken(kind, slug, excludeId)                                    -> boolean
//
// "publicOnly" applies the visibility rule in the query: a course is visible only if it is
// published AND its category is published.
const Category = require('./category.model')
const Course = require('./course.model')

const SORT = { displayOrder: 1, name: 1, _id: 1 }
const escapeRegex = term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const contains = term => ({ $regex: escapeRegex(term), $options: 'i' })

function toRecord(doc) {
  if (!doc) return null
  const { _id, ...rest } = doc
  return { id: _id, createdBy: null, updatedBy: null, ...rest }
}

const writable = (model, fields) => Object.fromEntries(Object.entries(fields).filter(([k, v]) => model.schema.path(k) && k !== '_id' && v !== undefined))

function createCatalogueRepository() {
  async function publishedCategoryIds() {
    return (await Category.find({ status: 'published' }, { _id: 1 }).lean()).map(c => c._id)
  }

  async function courseFilter({ publicOnly, status, categoryId, categorySlug, mode, q, featured }) {
    const filter = {}
    const categoryIds = []
    if (publicOnly) {
      filter.status = 'published'
      categoryIds.push(await publishedCategoryIds())
    } else if (status) filter.status = status
    if (categoryId) categoryIds.push([categoryId])
    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug }, { _id: 1 }).lean()
      categoryIds.push(category ? [category._id] : [])
    }
    if (categoryIds.length) filter.categoryId = { $in: categoryIds.reduce((acc, ids) => acc.filter(id => ids.includes(id))) }
    if (mode) filter.learningModes = mode
    if (featured !== undefined) filter.featured = Boolean(featured)
    if (q) filter.$or = [{ name: contains(q) }, { shortDescription: contains(q) }, { subjects: contains(q) }, { applicableFor: contains(q) }]
    return filter
  }

  return {
    async findCategories({ publicOnly = false, status, q, featured, limit = 20, offset = 0 } = {}) {
      const filter = {}
      if (publicOnly) filter.status = 'published'
      else if (status) filter.status = status
      if (featured !== undefined) filter.featured = Boolean(featured)
      if (q) filter.$or = [{ name: contains(q) }, { shortDescription: contains(q) }]
      const [items, total] = await Promise.all([
        Category.find(filter).sort(SORT).skip(offset).limit(limit).lean(),
        Category.countDocuments(filter),
      ])
      return { items: items.map(toRecord), total }
    },

    async getCategory({ id, slug }) {
      if (id) return toRecord(await Category.findById(id).lean())
      if (slug) return toRecord(await Category.findOne({ slug }).lean())
      return null
    },

    async insertCategory({ id, ...record }) {
      await Category.create({ _id: id, ...writable(Category, record) })
      return toRecord(await Category.findById(id).lean())
    },

    async updateCategory(id, fields) {
      await Category.updateOne({ _id: id }, { $set: writable(Category, fields) })
      return toRecord(await Category.findById(id).lean())
    },

    async findCourses({ publicOnly = false, status, categoryId, categorySlug, mode, q, featured, limit = 20, offset = 0 } = {}) {
      const filter = await courseFilter({ publicOnly, status, categoryId, categorySlug, mode, q, featured })
      const [items, total] = await Promise.all([
        Course.find(filter).sort(SORT).skip(offset).limit(limit).lean(),
        Course.countDocuments(filter),
      ])
      return { items: items.map(toRecord), total }
    },

    async getCourse({ id, slug, publicOnly = false }) {
      if (!id && !slug) return null
      const filter = {}
      if (id) filter._id = id
      if (slug) filter.slug = slug
      const course = await Course.findOne(filter).lean()
      if (!course) return null
      if (publicOnly) {
        if (course.status !== 'published') return null
        const category = await Category.findById(course.categoryId, { status: 1 }).lean()
        if (!category || category.status !== 'published') return null
      }
      return toRecord(course)
    },

    async insertCourse({ id, ...record }) {
      await Course.create({ _id: id, ...writable(Course, record) })
      return this.getCourse({ id })
    },

    async updateCourse(id, fields) {
      await Course.updateOne({ _id: id }, { $set: writable(Course, fields) })
      return this.getCourse({ id })
    },

    async countCoursesInCategory(categoryId, { excludeArchived = false } = {}) {
      return Course.countDocuments(excludeArchived ? { categoryId, status: { $ne: 'archived' } } : { categoryId })
    },

    async slugTaken(kind, slug, excludeId) {
      const model = kind === 'category' ? Category : Course
      const doc = await model.findOne({ slug }, { _id: 1 }).lean()
      return !!doc && doc._id !== excludeId
    },
  }
}

module.exports = { createCatalogueRepository }
