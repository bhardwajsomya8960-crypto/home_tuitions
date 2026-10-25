// Field-level validation for catalogue writes. Anything not listed in a spec is rejected,
// so clients cannot set restricted fields (status, timestamps, audit fields, source).

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const HEX_COLOUR = /^#[0-9a-fA-F]{6}$/
const KEY_PATTERN = /^[a-z0-9-]+$/
const PHONE_PATTERN = /^[6-9]\d{9}$/
const PINCODE_PATTERN = /^[1-9]\d{5}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

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
    case 'enum':
      return rule.allowed.includes(value) ? null : `must be one of: ${rule.allowed.join(', ')}`
    case 'phone':
      return typeof value === 'string' && PHONE_PATTERN.test(value) ? null : 'must be a 10-digit Indian mobile number'
    case 'pincode':
      return typeof value === 'string' && PINCODE_PATTERN.test(value) ? null : 'must be a 6-digit pincode'
    case 'email':
      return typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value) ? null : 'must be a valid email address'
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) && value >= rule.min && value <= rule.max ? null : `must be a number from ${rule.min} to ${rule.max}`
    case 'date':
      return typeof value === 'string' && DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value)) ? null : 'must be a date (YYYY-MM-DD)'
    case 'datetime':
      return typeof value === 'string' && value.length <= 40 && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value)) ? null : 'must be a date and time'
    case 'consent': {
      // { terms, communication, location? } — each a boolean
      if (!value || typeof value !== 'object' || Array.isArray(value)) return 'must be an object'
      for (const [k, v] of Object.entries(value)) {
        if (!['terms', 'communication', 'location'].includes(k) || typeof v !== 'boolean') return 'has an unknown or non-boolean entry'
      }
      return null
    }
    case 'slots': {
      // Weekly availability or schedule: [{ day, slot }]
      if (!Array.isArray(value)) return 'must be a list'
      if (value.length < (rule.minItems || 0)) return `must include at least ${rule.minItems}`
      if (value.length > 49) return 'has too many entries'
      for (const item of value) {
        if (!item || typeof item !== 'object' || !rule.days.includes(item.day) || !rule.slots.includes(item.slot)) {
          return 'entries must be { day, slot } with known values'
        }
      }
      return null
    }
    case 'weeklyHours': {
      // Tutor availability: [{ day, start: 'HH:MM', end: 'HH:MM' }], quarter hours, no overlaps on a day
      if (!Array.isArray(value)) return 'must be a list'
      if (value.length < (rule.minItems || 0)) return `must include at least ${rule.minItems}`
      if (value.length > 35) return 'has too many entries'
      const byDay = {}
      for (const item of value) {
        if (!item || typeof item !== 'object' || !rule.days.includes(item.day) || !TIME_PATTERN.test(item.start) || !TIME_PATTERN.test(item.end)) {
          return 'entries must be { day, start, end } with times as HH:MM'
        }
        if (Number(item.start.slice(3)) % 15 || Number(item.end.slice(3)) % 15) return 'times must be on the quarter hour'
        if (item.start >= item.end) return 'each end time must be after its start time'
        ;(byDay[item.day] ||= []).push(item)
      }
      for (const ranges of Object.values(byDay)) {
        ranges.sort((a, b) => a.start.localeCompare(b.start))
        for (let i = 1; i < ranges.length; i++) if (ranges[i].start < ranges[i - 1].end) return 'times on the same day must not overlap'
      }
      return null
    }
    case 'timeOff': {
      // [{ from, to, reason? }] with dates as YYYY-MM-DD
      if (!Array.isArray(value)) return 'must be a list'
      if (value.length > 30) return 'has too many entries'
      for (const item of value) {
        if (!item || typeof item !== 'object' || Object.keys(item).some(k => !['from', 'to', 'reason'].includes(k))) return 'entries must be { from, to, reason }'
        if (![item.from, item.to].every(d => typeof d === 'string' && DATE_PATTERN.test(d) && !Number.isNaN(Date.parse(d)))) return 'dates must be YYYY-MM-DD'
        if (item.to < item.from) return 'each end date must be on or after its start date'
        if (item.reason !== undefined && (typeof item.reason !== 'string' || item.reason.length > 100)) return 'reasons must be text up to 100 characters'
      }
      return null
    }
    case 'stringArray': {
      if (!Array.isArray(value)) return 'must be a list'
      if (value.length < (rule.minItems || 0)) return rule.minItems === 1 ? 'must include at least one item' : `must include at least ${rule.minItems} items`
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
    if (['string', 'phone', 'pincode', 'email'].includes(rule.type) && typeof raw === 'string') raw = raw.trim()
    if (rule.type === 'email' && typeof raw === 'string') raw = raw.toLowerCase()
    if (rule.type === 'stringArray' && Array.isArray(raw)) raw = [...new Set(raw)]
    if (rule.type === 'slots' && Array.isArray(raw)) {
      const seen = new Set()
      raw = raw.filter(item => {
        const key = item && `${item.day}:${item.slot}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).map(item => (item && typeof item === 'object' ? { day: item.day, slot: item.slot } : item))
    }
    // Optional text fields may be sent empty; treat that as "not provided".
    if (rule.type === 'string' && !rule.required && raw === '') { value[key] = ''; continue }
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
