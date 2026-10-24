const crypto = require('crypto')
const { AppError } = require('../../errors')
const { validateFields } = require('../validation')
const { DEFAULT_SETTINGS } = require('../matchingService')

// Shared helpers for the operations modules. `actor` strings identify who made a change:
// 'admin', 'parent:<id>', 'tutor:<id>' or 'system'.
function createContext({ repo, now = () => new Date(), newId = () => crypto.randomUUID() }) {
  const iso = () => now().toISOString()

  const ctx = {
    repo,
    now,
    iso,
    newId,
    // Calendar date in India (UTC+5:30), used for schedules, due dates and "today".
    today: () => new Date(now().getTime() + 330 * 60000).toISOString().slice(0, 10),

    notFound: what => new AppError(404, 'NOT_FOUND', `${what} not found`),
    conflict: (code, message) => new AppError(409, code, message),
    invalid: (errors, message = 'Some fields are invalid') => new AppError(400, 'VALIDATION_FAILED', message, errors),

    // Validates and returns accepted fields, or throws a 400 listing every problem.
    validate(body, spec, options) {
      const { value, errors } = validateFields(body, spec, options)
      if (errors.length) throw ctx.invalid(errors)
      return value
    },

    require(table, id, label) {
      const record = typeof id === 'string' ? repo.get(table, id) : null
      if (!record) throw ctx.notFound(label)
      return record
    },

    audit(actor, action, entity, entityId, details) {
      repo.insert('audit_log', { id: newId(), actor, action, entity, entityId, details: details || null, createdAt: iso() })
    },

    event(leadId, type, actor, { from = null, to = null, note = null } = {}) {
      repo.insert('lead_events', { id: newId(), leadId, type, fromStatus: from, toStatus: to, actor, note, createdAt: iso() })
    },

    // Moves a lead to a new status only if it is still in `from` (guards against races).
    // Returns the updated lead, or null when its status had already changed.
    moveLead(lead, to, actor, { note, type = 'status_changed' } = {}) {
      const changed = repo.update('leads', lead.id, { status: to, updatedAt: iso() }, { status: lead.status })
      if (!changed) return null
      ctx.event(lead.id, type, actor, { from: lead.status, to, note })
      ctx.audit(actor, 'lead.status', 'lead', lead.id, { from: lead.status, to })
      return repo.get('leads', lead.id)
    },

    settings() {
      const row = repo.get('settings', 'matching')
      return row ? { ...DEFAULT_SETTINGS, ...row.value, weights: { ...DEFAULT_SETTINGS.weights, ...(row.value.weights || {}) } } : DEFAULT_SETTINGS
    },
  }
  return ctx
}

// Parses ?page=&limit= into { limit, offset, page }.
function pageParams(query = {}) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100)
  const page = Math.max(parseInt(query.page, 10) || 1, 1)
  return { limit, offset: (page - 1) * limit, page }
}

module.exports = { createContext, pageParams }
