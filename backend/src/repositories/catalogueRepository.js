// Repository contract for catalogue storage.
//
// Services depend only on these methods, never on SQL. To move to another datastore
// (for example Zoho Catalyst), implement the same methods against that datastore.
//
//   findCategories({ publicOnly, status, q, featured, limit, offset })  -> { items, total }
//   getCategory({ id, slug })                                           -> category | null
//   insertCategory(record)                                              -> category
//   updateCategory(id, fields)                                          -> category | null
//   findCourses({ publicOnly, status, categoryId, categorySlug, mode, q, featured, limit, offset }) -> { items, total }
//   getCourse({ id, slug, publicOnly })                                 -> course | null
//   insertCourse(record)                                                -> course
//   updateCourse(id, fields)                                            -> course | null
//   countCoursesInCategory(categoryId, { excludeArchived })             -> number
//   slugTaken(kind, slug, excludeId)                                    -> boolean
//
// "publicOnly" applies visibility rules in the query itself: a course is visible only if
// it is published AND its category is published.

const JSON_FIELDS = ['subjects', 'learning_objectives', 'prerequisites', 'learning_modes']

function toCategory(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description || '',
    description: row.description || '',
    iconKey: row.icon_key || '',
    accentColour: row.accent_colour || '',
    coverImageUrl: row.cover_image_url || '',
    displayOrder: row.display_order,
    featured: !!row.featured,
    status: row.status,
    seoTitle: row.seo_title || '',
    seoDescription: row.seo_description || '',
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by || null,
    updatedBy: row.updated_by || null,
  }
}

function toCourse(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categoryId: row.category_id,
    shortDescription: row.short_description || '',
    description: row.description || '',
    levelLabel: row.level_label || '',
    applicableFor: row.applicable_for || '',
    subjects: JSON.parse(row.subjects),
    learningObjectives: JSON.parse(row.learning_objectives),
    prerequisites: JSON.parse(row.prerequisites),
    targetAudience: row.target_audience || '',
    learningModes: JSON.parse(row.learning_modes),
    coverImageUrl: row.cover_image_url || '',
    displayOrder: row.display_order,
    featured: !!row.featured,
    status: row.status,
    seoTitle: row.seo_title || '',
    seoDescription: row.seo_description || '',
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by || null,
    updatedBy: row.updated_by || null,
  }
}

// Maps camelCase record fields to column names. Only listed keys can be written.
const CATEGORY_COLUMNS = {
  id: 'id',
  slug: 'slug', name: 'name', shortDescription: 'short_description', description: 'description',
  iconKey: 'icon_key', accentColour: 'accent_colour', coverImageUrl: 'cover_image_url',
  displayOrder: 'display_order', featured: 'featured', status: 'status',
  seoTitle: 'seo_title', seoDescription: 'seo_description', source: 'source',
  createdAt: 'created_at', updatedAt: 'updated_at', createdBy: 'created_by', updatedBy: 'updated_by',
}
const COURSE_COLUMNS = {
  id: 'id',
  slug: 'slug', name: 'name', categoryId: 'category_id', shortDescription: 'short_description',
  description: 'description', levelLabel: 'level_label', applicableFor: 'applicable_for',
  subjects: 'subjects', learningObjectives: 'learning_objectives', prerequisites: 'prerequisites',
  targetAudience: 'target_audience', learningModes: 'learning_modes', coverImageUrl: 'cover_image_url',
  displayOrder: 'display_order', featured: 'featured', status: 'status',
  seoTitle: 'seo_title', seoDescription: 'seo_description', source: 'source',
  createdAt: 'created_at', updatedAt: 'updated_at', createdBy: 'created_by', updatedBy: 'updated_by',
}

function encode(value, key) {
  if (JSON_FIELDS.includes(key)) return JSON.stringify(value)
  if (key === 'featured') return value ? 1 : 0
  return value
}

function buildUpdate(table, columns, id, fields, db) {
  const entries = Object.entries(fields).filter(([k]) => columns[k])
  if (entries.length === 0) return null
  const assignments = entries.map(([k]) => `${columns[k]} = ?`).join(', ')
  const values = entries.map(([k, v]) => encode(v, columns[k]))
  db.prepare(`UPDATE ${table} SET ${assignments} WHERE id = ?`).run(...values, id)
  return true
}

function likeEscape(term) {
  return `%${term.replace(/[\\%_]/g, c => `\\${c}`)}%`
}

function createCatalogueRepository(db) {
  const selectCategory = db.prepare('SELECT * FROM categories WHERE id = ?')
  const selectCategoryBySlug = db.prepare('SELECT * FROM categories WHERE slug = ?')

  function insert(table, columns, record) {
    const keys = Object.keys(record).filter(k => columns[k])
    const sql = `INSERT INTO ${table} (${keys.map(k => columns[k]).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`
    db.prepare(sql).run(...keys.map(k => encode(record[k], columns[k])))
  }

  function categoryWhere({ publicOnly, status, q, featured }) {
    const where = []
    const params = []
    if (publicOnly) where.push("c.status = 'published'")
    else if (status) { where.push('c.status = ?'); params.push(status) }
    if (featured !== undefined) { where.push('c.featured = ?'); params.push(featured ? 1 : 0) }
    if (q) {
      where.push("(c.name LIKE ? ESCAPE '\\' OR c.short_description LIKE ? ESCAPE '\\')")
      params.push(likeEscape(q), likeEscape(q))
    }
    return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params }
  }

  function courseWhere({ publicOnly, status, categoryId, categorySlug, mode, q, featured }) {
    const where = []
    const params = []
    if (publicOnly) where.push("c.status = 'published'", "cat.status = 'published'")
    else if (status) { where.push('c.status = ?'); params.push(status) }
    if (categoryId) { where.push('c.category_id = ?'); params.push(categoryId) }
    if (categorySlug) { where.push('cat.slug = ?'); params.push(categorySlug) }
    if (mode) { where.push('c.learning_modes LIKE ?'); params.push(`%"${mode}"%`) }
    if (featured !== undefined) { where.push('c.featured = ?'); params.push(featured ? 1 : 0) }
    if (q) {
      where.push("(c.name LIKE ? ESCAPE '\\' OR c.short_description LIKE ? ESCAPE '\\' OR c.subjects LIKE ? ESCAPE '\\' OR c.applicable_for LIKE ? ESCAPE '\\')")
      const term = likeEscape(q)
      params.push(term, term, term, term)
    }
    return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params }
  }

  return {
    async findCategories({ publicOnly = false, status, q, featured, limit = 20, offset = 0 } = {}) {
      const { sql, params } = categoryWhere({ publicOnly, status, q, featured })
      const total = db.prepare(`SELECT COUNT(*) AS n FROM categories c ${sql}`).get(...params).n
      const rows = db.prepare(`SELECT c.* FROM categories c ${sql} ORDER BY c.display_order ASC, c.name ASC LIMIT ? OFFSET ?`)
        .all(...params, limit, offset)
      return { items: rows.map(toCategory), total }
    },

    async getCategory({ id, slug }) {
      if (id) return toCategory(selectCategory.get(id))
      if (slug) return toCategory(selectCategoryBySlug.get(slug))
      return null
    },

    async insertCategory(record) {
      insert('categories', CATEGORY_COLUMNS, record)
      return toCategory(selectCategory.get(record.id))
    },

    async updateCategory(id, fields) {
      buildUpdate('categories', CATEGORY_COLUMNS, id, fields, db)
      return toCategory(selectCategory.get(id))
    },

    async findCourses({ publicOnly = false, status, categoryId, categorySlug, mode, q, featured, limit = 20, offset = 0 } = {}) {
      const { sql, params } = courseWhere({ publicOnly, status, categoryId, categorySlug, mode, q, featured })
      const from = 'FROM courses c JOIN categories cat ON cat.id = c.category_id'
      const total = db.prepare(`SELECT COUNT(*) AS n ${from} ${sql}`).get(...params).n
      const rows = db.prepare(`SELECT c.* ${from} ${sql} ORDER BY c.display_order ASC, c.name ASC LIMIT ? OFFSET ?`)
        .all(...params, limit, offset)
      return { items: rows.map(toCourse), total }
    },

    async getCourse({ id, slug, publicOnly = false }) {
      const clauses = []
      const values = []
      if (id) { clauses.push('c.id = ?'); values.push(id) }
      if (slug) { clauses.push('c.slug = ?'); values.push(slug) }
      if (clauses.length === 0) return null
      const visibility = publicOnly ? "AND c.status = 'published' AND cat.status = 'published'" : ''
      const row = db.prepare(`SELECT c.* FROM courses c JOIN categories cat ON cat.id = c.category_id WHERE ${clauses.join(' AND ')} ${visibility}`).get(...values)
      return toCourse(row)
    },

    async insertCourse(record) {
      insert('courses', COURSE_COLUMNS, record)
      return this.getCourse({ id: record.id })
    },

    async updateCourse(id, fields) {
      buildUpdate('courses', COURSE_COLUMNS, id, fields, db)
      return this.getCourse({ id })
    },

    async countCoursesInCategory(categoryId, { excludeArchived = false } = {}) {
      const sql = excludeArchived
        ? "SELECT COUNT(*) AS n FROM courses WHERE category_id = ? AND status != 'archived'"
        : 'SELECT COUNT(*) AS n FROM courses WHERE category_id = ?'
      return db.prepare(sql).get(categoryId).n
    },

    async slugTaken(kind, slug, excludeId) {
      const table = kind === 'category' ? 'categories' : 'courses'
      const row = db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(slug)
      return !!row && row.id !== excludeId
    },
  }
}

module.exports = { createCatalogueRepository }
