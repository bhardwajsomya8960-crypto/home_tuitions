// Field-level validation for catalogue writes. Anything not listed in a spec is rejected,
// so clients cannot set restricted fields (status, timestamps, audit fields, source).

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const HEX_COLOUR = /^#[0-9a-fA-F]{6}$/
const KEY_PATTERN = /^[a-z0-9-]+$/

function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function checkValue(rule, value) {
  switch (rule.type) {
    case 'string': {
      if (typeof value !== 'string') return 'must be a string'
      const trimmed = value.trim()
      if (rule.required && trimmed.length === 0) return 'is required'
      if (trimmed.length < (rule.min || 0)) return `must be at least ${rule.min} characters`
      if (trimmed.length > rule.max) return `must be at most ${rule.max} characters`
      return null
    }
    case 'slug':
      if (typeof value !== 'string' || !SLUG_PATTERN.test(value) || value.length > 80) {
        return 'must be lowercase letters, numbers and single hyphens'
      }
      return null
    case 'colour':
      return typeof value === 'string' && HEX_COLOUR.test(value) ? null : 'must be a hex colour such as #F7E96B'
    case 'key':
      return typeof value === 'string' && KEY_PATTERN.test(value) && value.length <= 40 ? null : 'must be a short lowercase key'
    case 'url':
      if (typeof value !== 'string' || value.length > 500) return 'must be a short https:// or /path URL'
      if (value === '') return null
      if (value.startsWith('https://') || (value.startsWith('/') && !value.startsWith('//'))) return null
      return 'must be an https:// or /path URL'
    case 'int':
      return Number.isInteger(value) && value >= rule.min && value <= rule.max ? null : `must be a whole number from ${rule.min} to ${rule.max}`
    case 'bool':
      return typeof value === 'boolean' ? null : 'must be true or false'
    case 'id':
      return typeof value === 'string' && value.length > 0 && value.length <= 64 ? null : 'is not a valid id'
    case 'stringArray': {
      if (!Array.isArray(value)) return 'must be a list'
      if (value.length > rule.maxItems) return `may contain at most ${rule.maxItems} items`
      for (const item of value) {
        if (typeof item !== 'string' || item.trim().length === 0 || item.length > rule.maxItemLength) {
          return `items must be text up to ${rule.maxItemLength} characters`
        }
        if (rule.allowed && !rule.allowed.includes(item)) return `items must be one of: ${rule.allowed.join(', ')}`
      }
      return null
    }
    default:
      return 'has an unsupported type'
  }
}

// Validates `body` against `spec`. `partial` allows omitting fields (for PATCH).
// Returns { value, errors } where value holds only the accepted, normalised fields.
function validateFields(body, spec, { partial = false } = {}) {
  const errors = []
  const value = {}

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { value, errors: [{ field: '_body', message: 'must be a JSON object' }] }
  }

  for (const key of Object.keys(body)) {
    if (!spec[key]) errors.push({ field: key, message: 'is not an editable field' })
  }

  for (const [key, rule] of Object.entries(spec)) {
    if (!(key in body) || body[key] === undefined) {
      if (!partial && rule.required) errors.push({ field: key, message: 'is required' })
      continue
    }
    let raw = body[key]
    if (rule.type === 'string' && typeof raw === 'string') raw = raw.trim()
    const problem = checkValue(rule, raw)
    if (problem) {
      errors.push({ field: key, message: problem })
    } else {
      value[key] = raw
    }
  }

  return { value, errors }
}

module.exports = { validateFields, slugify, SLUG_PATTERN }
