const { AppError } = require('./errors')
const { validateFields } = require('./validation')
const { newId: defaultNewId } = require('./utils/ids')
const { DEFAULT_SETTINGS } = require('../modules/matching/matching.engine')

// Shared helpers for every module service. `actor` strings identify who made a change:
// 'admin', 'parent:<id>', 'tutor:<id>' or 'system'. The clock and id generator can be replaced
// in tests.
function createContext({ repo, now = () => new Date(), newId = defaultNewId }) {
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

    async require(model, id, label) {
      const record = typeof id === 'string' ? await repo.get(model, id) : null
      if (!record) throw ctx.notFound(label)
      return record
    },

    async audit(actor, action, entity, entityId, details) {
      await repo.insert('AuditLog', { id: newId(), actor, action, entity, entityId, details: details || null, createdAt: iso() })
    },

    async event(leadId, type, actor, { from = null, to = null, note = null } = {}) {
      await repo.insert('LeadEvent', { id: newId(), leadId, type, fromStatus: from, toStatus: to, actor, note, createdAt: iso() })
    },

    // Moves a lead to a new status only if it is still in `from` (guards against races).
    // Returns the updated lead, or null when its status had already changed.
    async moveLead(lead, to, actor, { note, type = 'status_changed' } = {}) {
      const changed = await repo.update('Lead', lead.id, { status: to, updatedAt: iso() }, { status: lead.status })
      if (!changed) return null
      await ctx.event(lead.id, type, actor, { from: lead.status, to, note })
      await ctx.audit(actor, 'lead.status', 'lead', lead.id, { from: lead.status, to })
      return repo.get('Lead', lead.id)
    },

    async settings() {
      const row = await repo.get('Setting', 'matching')
      return row ? { ...DEFAULT_SETTINGS, ...row.value, weights: { ...DEFAULT_SETTINGS.weights, ...(row.value.weights || {}) } } : DEFAULT_SETTINGS
    },
  }
  return ctx
}

module.exports = { createContext }
