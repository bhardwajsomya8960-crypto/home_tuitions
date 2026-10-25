const { validateSettings, DEFAULT_SETTINGS } = require('../matching/matching.engine')

// Matching rules that staff can change (blueprint §17): weights, distance bands, offer timing.
function createSettingsService(ctx) {
  const { repo } = ctx

  const self = {
    async getSettings() {
      return { settings: await ctx.settings(), defaults: DEFAULT_SETTINGS }
    },

    async updateSettings(body, actor) {
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw ctx.invalid([{ field: '_body', message: 'must be a JSON object' }])
      const unknown = Object.keys(body).filter(k => !(k in DEFAULT_SETTINGS))
      if (unknown.length) throw ctx.invalid(unknown.map(field => ({ field, message: 'is not a setting' })))
      const before = await ctx.settings()
      const next = { ...before, ...body, weights: { ...before.weights, ...(body.weights || {}) } }
      const problems = validateSettings(next)
      if (problems.length) throw ctx.invalid(problems.map(message => ({ field: 'settings', message })))
      await repo.saveSetting('matching', next, ctx.iso(), actor)
      await ctx.audit(actor, 'settings.update', 'settings', 'matching', { before, after: next })
      return self.getSettings()
    },
  }
  return self
}

module.exports = { createSettingsService }
