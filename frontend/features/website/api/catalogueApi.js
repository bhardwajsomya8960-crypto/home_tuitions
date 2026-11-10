// The public course catalogue, read from the website's own data file
// (features/website/catalogue/catalogue.data.js) instead of the backend API, so the Courses and
// Categories pages work on a frontend-only deployment. The functions and the shapes they return
// match the backend's public catalogue API, so the pages do not depend on where the data lives.
import { CATEGORIES, COURSES } from '@/features/website/catalogue/catalogue.data'

// Kept so the pages' existing error handling still compiles; reading local data does not fail.
export class CatalogueUnavailableError extends Error {
  constructor(message = 'The catalogue is temporarily unavailable.') {
    super(message)
    this.name = 'CatalogueUnavailableError'
  }
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const byOrder = (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
const publishedCategories = () => CATEGORIES.filter(c => c.status === 'published').sort(byOrder)
const isPublicCourse = course => course.status === 'published' && publishedCategories().some(c => c.id === course.categoryId)
const contains = (text, q) => typeof text === 'string' && text.toLowerCase().includes(q)

function pageParams(params = {}) {
  const limit = Math.min(Math.max(parseInt(params.limit, 10) || 20, 1), 100)
  const page = Math.max(parseInt(params.page, 10) || 1, 1)
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 100).toLowerCase() : ''
  return { limit, page, offset: (page - 1) * limit, q }
}

const paged = (items, { limit, offset, page }) => ({ items: items.slice(offset, offset + limit), total: items.length, limit, page })

export async function listCategories(params = {}) {
  const p = pageParams(params)
  let items = publishedCategories()
  if (params.featured === 'true' || params.featured === true) items = items.filter(c => c.featured)
  if (p.q) items = items.filter(c => contains(c.name, p.q) || contains(c.shortDescription, p.q))
  return paged(items, p)
}

export async function getCategory(slug) {
  const category = publishedCategories().find(c => c.slug === slug)
  if (!category) return null
  return { ...category, courses: COURSES.filter(c => c.categoryId === category.id && isPublicCourse(c)).sort(byOrder) }
}

export async function listCourses(params = {}) {
  const p = pageParams(params)
  let items = COURSES.filter(isPublicCourse)
  if (typeof params.category === 'string' && SLUG.test(params.category)) {
    const category = CATEGORIES.find(c => c.slug === params.category)
    items = category ? items.filter(c => c.categoryId === category.id) : []
  }
  if (['home', 'online'].includes(params.mode)) items = items.filter(c => c.learningModes.includes(params.mode))
  if (params.featured === 'true' || params.featured === true) items = items.filter(c => c.featured)
  if (p.q) items = items.filter(c => contains(c.name, p.q) || contains(c.shortDescription, p.q) || contains(c.applicableFor, p.q) || c.subjects.some(s => contains(s, p.q)))
  return paged(items.sort(byOrder), p)
}

export async function getCourse(slug) {
  const course = COURSES.find(c => c.slug === slug && isPublicCourse(c))
  if (!course) return null
  const category = CATEGORIES.find(c => c.id === course.categoryId)
  return { ...course, category: { slug: category.slug, name: category.name } }
}
