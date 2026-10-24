const crypto = require('crypto')
const { AppError } = require('../errors')
const { validateFields, slugify, SLUG_PATTERN } = require('./validation')
const { categorySpec, courseSpec } = require('./catalogueSpecs')

const PUBLIC_HIDDEN_FIELDS = ['source', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt']

function stripForPublic(record) {
  const out = { ...record }
  for (const key of PUBLIC_HIDDEN_FIELDS) delete out[key]
  return out
}

function pageParams(query = {}) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100)
  const page = Math.max(parseInt(query.page, 10) || 1, 1)
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 100) : ''
  return { limit, offset: (page - 1) * limit, page, q }
}

function createCatalogueService({ repo, now = () => new Date().toISOString(), newId = () => crypto.randomUUID() }) {
  const validationError = (errors) => new AppError(400, 'VALIDATION_FAILED', 'Some fields are invalid', errors)
  const notFound = (what) => new AppError(404, 'NOT_FOUND', `${what} not found`)

  async function requireCategory(id) {
    const category = await repo.getCategory({ id })
    if (!category) throw notFound('Category')
    return category
  }

  async function requireCourse(id) {
    const course = await repo.getCourse({ id })
    if (!course) throw notFound('Course')
    return course
  }

  function assertEditable(record, label) {
    if (record.status === 'archived') {
      throw new AppError(409, 'ARCHIVED', `${label} is archived. Restore it before editing.`)
    }
  }

  async function adminCourseView(id) {
    const course = await requireCourse(id)
    return { ...course, publiclyVisible: await publiclyVisible(course) }
  }

  // Whether a course is visible to the public: course published and its category published.
  async function publiclyVisible(course) {
    if (course.status !== 'published') return false
    const category = await repo.getCategory({ id: course.categoryId })
    return !!category && category.status === 'published'
  }

  return {
    // ---- Public ----------------------------------------------------------------------------
    async listPublicCategories(query) {
      const { limit, offset, q } = pageParams(query)
      const featured = query.featured === 'true' ? true : undefined
      const { items, total } = await repo.findCategories({ publicOnly: true, q, featured, limit, offset })
      return { items: items.map(stripForPublic), total, limit, page: Math.floor(offset / limit) + 1 }
    },

    async getPublicCategory(slug) {
      const category = await repo.getCategory({ slug })
      if (!category || category.status !== 'published') throw notFound('Category')
      const { items: courses } = await repo.findCourses({ publicOnly: true, categoryId: category.id, limit: 100, offset: 0 })
      return { ...stripForPublic(category), courses: courses.map(stripForPublic) }
    },

    async listPublicCourses(query) {
      const { limit, offset, page, q } = pageParams(query)
      const mode = ['home', 'online'].includes(query.mode) ? query.mode : undefined
      const categorySlug = typeof query.category === 'string' && SLUG_PATTERN.test(query.category) ? query.category : undefined
      const featured = query.featured === 'true' ? true : undefined
      const { items, total } = await repo.findCourses({ publicOnly: true, q, mode, categorySlug, featured, limit, offset })
      return { items: items.map(stripForPublic), total, limit, page }
    },

    async getPublicCourse(slug) {
      const course = await repo.getCourse({ slug, publicOnly: true })
      if (!course) throw notFound('Course')
      const category = await repo.getCategory({ id: course.categoryId })
      return { ...stripForPublic(course), category: { slug: category.slug, name: category.name } }
    },

    // Used by enquiry validation. Returns a publicly visible course or throws.
    async resolvePublicCourse({ courseId, courseSlug }) {
      const hasId = courseId !== undefined && courseId !== null
      const hasSlug = courseSlug !== undefined && courseSlug !== null
      if (!hasId && !hasSlug) return null
      const byId = hasId ? await repo.getCourse({ id: courseId, publicOnly: true }) : null
      const bySlug = hasSlug ? await repo.getCourse({ slug: courseSlug, publicOnly: true }) : null
      if (hasId && !byId) throw new AppError(400, 'INVALID_COURSE', 'The selected course is not available')
      if (hasSlug && !bySlug) throw new AppError(400, 'INVALID_COURSE', 'The selected course is not available')
      if (byId && bySlug && byId.id !== bySlug.id) throw new AppError(400, 'INVALID_COURSE', 'Course id and slug do not match')
      return byId || bySlug
    },

    // ---- Admin: categories -----------------------------------------------------------------
    async listAdminCategories(query) {
      const { limit, offset, page, q } = pageParams(query)
      const status = ['draft', 'published', 'archived'].includes(query.status) ? query.status : undefined
      const { items, total } = await repo.findCategories({ status, q, limit, offset })
      return { items, total, limit, page }
    },

    async getAdminCategory(id) {
      return requireCategory(id)
    },

    async createCategory(body, actor) {
      const { value, errors } = validateFields(body, categorySpec)
      if (errors.length) throw validationError(errors)
      const slug = value.slug || slugify(value.name)
      if (!slug || !SLUG_PATTERN.test(slug)) throw validationError([{ field: 'slug', message: 'could not be generated from the name' }])
      if (await repo.slugTaken('category', slug)) throw new AppError(409, 'SLUG_TAKEN', 'A category with this slug already exists')

      const stamp = now()
      const record = {
        id: newId(),
        shortDescription: '', description: '', iconKey: '', accentColour: '', coverImageUrl: '',
        displayOrder: 0, featured: false, seoTitle: '', seoDescription: '',
        ...value,
        slug,
        status: 'draft',
        source: 'admin',
        createdAt: stamp,
        updatedAt: stamp,
        createdBy: actor,
        updatedBy: actor,
      }
      return repo.insertCategory(record)
    },

    async updateCategory(id, body, actor) {
      const existing = await requireCategory(id)
      assertEditable(existing, 'Category')
      const { value, errors } = validateFields(body, categorySpec, { partial: true })
      if (errors.length) throw validationError(errors)
      if (value.slug && value.slug !== existing.slug && await repo.slugTaken('category', value.slug, id)) {
        throw new AppError(409, 'SLUG_TAKEN', 'A category with this slug already exists')
      }
      return repo.updateCategory(id, { ...value, updatedAt: now(), updatedBy: actor })
    },

    async transitionCategory(id, action, actor) {
      const category = await requireCategory(id)
      const stamp = { updatedAt: now(), updatedBy: actor }

      if (action === 'publish') {
        if (category.status !== 'draft') throw new AppError(409, 'INVALID_TRANSITION', `Cannot publish a ${category.status} category`)
        const missing = []
        if (category.name.length < 2) missing.push('name')
        if (!category.shortDescription) missing.push('shortDescription')
        if (missing.length) throw new AppError(422, 'PUBLISH_REQUIREMENTS', 'Complete these fields before publishing', missing)
        return repo.updateCategory(id, { status: 'published', ...stamp })
      }

      if (action === 'unpublish') {
        if (category.status !== 'published') throw new AppError(409, 'INVALID_TRANSITION', 'Only a published category can be unpublished')
        return repo.updateCategory(id, { status: 'draft', ...stamp })
      }

      if (action === 'archive') {
        if (category.status === 'archived') throw new AppError(409, 'INVALID_TRANSITION', 'Category is already archived')
        const active = await repo.countCoursesInCategory(id, { excludeArchived: true })
        if (active > 0) {
          throw new AppError(409, 'CATEGORY_HAS_COURSES',
            `This category still has ${active} course(s). Archive or move them first.`, { activeCourses: active })
        }
        return repo.updateCategory(id, { status: 'archived', ...stamp })
      }

      if (action === 'restore') {
        if (category.status !== 'archived') throw new AppError(409, 'INVALID_TRANSITION', 'Only an archived category can be restored')
        return repo.updateCategory(id, { status: 'draft', ...stamp })
      }

      throw new AppError(400, 'UNKNOWN_ACTION', 'Unknown action')
    },

    // ---- Admin: courses --------------------------------------------------------------------
    async listAdminCourses(query) {
      const { limit, offset, page, q } = pageParams(query)
      const status = ['draft', 'published', 'archived'].includes(query.status) ? query.status : undefined
      const mode = ['home', 'online'].includes(query.mode) ? query.mode : undefined
      const categoryId = typeof query.categoryId === 'string' ? query.categoryId : undefined
      const featured = query.featured === 'true' ? true : query.featured === 'false' ? false : undefined
      const { items, total } = await repo.findCourses({ status, categoryId, mode, q, featured, limit, offset })
      const withVisibility = await Promise.all(items.map(async course => ({ ...course, publiclyVisible: await publiclyVisible(course) })))
      return { items: withVisibility, total, limit, page }
    },

    async getAdminCourse(id) {
      return adminCourseView(id)
    },

    async createCourse(body, actor) {
      const { value, errors } = validateFields(body, courseSpec)
      if (errors.length) throw validationError(errors)
      await assertCategoryAssignable(value.categoryId)
      const slug = value.slug || slugify(value.name)
      if (!slug || !SLUG_PATTERN.test(slug)) throw validationError([{ field: 'slug', message: 'could not be generated from the name' }])
      if (await repo.slugTaken('course', slug)) throw new AppError(409, 'SLUG_TAKEN', 'A course with this slug already exists')

      const stamp = now()
      const record = {
        id: newId(),
        shortDescription: '', description: '', levelLabel: '', applicableFor: '', targetAudience: '',
        subjects: [], learningObjectives: [], prerequisites: [], learningModes: [], coverImageUrl: '',
        displayOrder: 0, featured: false, seoTitle: '', seoDescription: '',
        ...value,
        slug,
        status: 'draft',
        source: 'admin',
        createdAt: stamp,
        updatedAt: stamp,
        createdBy: actor,
        updatedBy: actor,
      }
      return repo.insertCourse(record)
    },

    async updateCourse(id, body, actor) {
      const existing = await requireCourse(id)
      assertEditable(existing, 'Course')
      const { value, errors } = validateFields(body, courseSpec, { partial: true })
      if (errors.length) throw validationError(errors)
      if (value.categoryId && value.categoryId !== existing.categoryId) await assertCategoryAssignable(value.categoryId)
      if (value.slug && value.slug !== existing.slug && await repo.slugTaken('course', value.slug, id)) {
        throw new AppError(409, 'SLUG_TAKEN', 'A course with this slug already exists')
      }
      await repo.updateCourse(id, { ...value, updatedAt: now(), updatedBy: actor })
      return adminCourseView(id)
    },

    async transitionCourse(id, action, actor) {
      const course = await requireCourse(id)
      const stamp = { updatedAt: now(), updatedBy: actor }

      if (action === 'publish') {
        if (course.status !== 'draft') throw new AppError(409, 'INVALID_TRANSITION', `Cannot publish a ${course.status} course`)
        const category = await repo.getCategory({ id: course.categoryId })
        if (!category || category.status !== 'published') {
          throw new AppError(409, 'CATEGORY_NOT_PUBLISHED', 'Publish the course category before publishing this course')
        }
        const missing = []
        if (!course.shortDescription) missing.push('shortDescription')
        if (course.learningModes.length === 0) missing.push('learningModes')
        if (missing.length) throw new AppError(422, 'PUBLISH_REQUIREMENTS', 'Complete these fields before publishing', missing)
        await repo.updateCourse(id, { status: 'published', ...stamp })
        return adminCourseView(id)
      }

      if (action === 'unpublish') {
        if (course.status !== 'published') throw new AppError(409, 'INVALID_TRANSITION', 'Only a published course can be unpublished')
        await repo.updateCourse(id, { status: 'draft', ...stamp })
        return adminCourseView(id)
      }

      if (action === 'archive') {
        if (course.status === 'archived') throw new AppError(409, 'INVALID_TRANSITION', 'Course is already archived')
        await repo.updateCourse(id, { status: 'archived', featured: false, ...stamp })
        return adminCourseView(id)
      }

      if (action === 'restore') {
        if (course.status !== 'archived') throw new AppError(409, 'INVALID_TRANSITION', 'Only an archived course can be restored')
        await repo.updateCourse(id, { status: 'draft', ...stamp })
        return adminCourseView(id)
      }

      throw new AppError(400, 'UNKNOWN_ACTION', 'Unknown action')
    },
  }

  // A course cannot be placed in a category that does not exist or has been archived.
  async function assertCategoryAssignable(categoryId) {
    const category = await repo.getCategory({ id: categoryId })
    if (!category) throw new AppError(422, 'INVALID_REFERENCE', 'The selected category does not exist')
    if (category.status === 'archived') throw new AppError(422, 'INVALID_REFERENCE', 'The selected category is archived')
  }
}

module.exports = { createCatalogueService, stripForPublic }
