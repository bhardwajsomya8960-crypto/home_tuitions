// Matching rules.
function createSettingsController({ services }) {
  const { settings } = services
  return {
    get: () => settings.getSettings(),
    update: req => settings.updateSettings(req.body, 'admin'),
  }
}

module.exports = { createSettingsController }
