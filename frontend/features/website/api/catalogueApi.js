// Server-side reads from the public catalogue API. Runs only in Server Components.
// Responses are cached and revalidated; a failed request is reported, never replaced with sample data.

const BASE_URL = process.env.CATALOGUE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export class CatalogueUnavailableError extends Error {
  constructor(message = 'The catalogue is temporarily unavailable.') {
    super(message)
    this.name = 'CatalogueUnavailableError'
  }
}

async function request(path, { revalidate = 60 } = {}) {
  let res
  try {
    res = await fetch(`${BASE_URL}/api/catalogue${path}`, { next: { revalidate } })
  } catch {
    throw new CatalogueUnavailableError()
  }
  if (res.status === 404) return null
  if (!res.ok) throw new CatalogueUnavailableError()
  return res.json()
}

const qs = params => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}` : ''
}

export function listCategories(params = {}) {
  return request(`/categories${qs(params)}`)
}

export function getCategory(slug) {
  return request(`/categories/${encodeURIComponent(slug)}`)
}

export function listCourses(params = {}) {
  return request(`/courses${qs(params)}`)
}

export function getCourse(slug) {
  return request(`/courses/${encodeURIComponent(slug)}`)
}
