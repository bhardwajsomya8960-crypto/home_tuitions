// The parent dashboard: requests, students, upcoming classes, fees.
function createOverviewController({ services }) {
  const { parentPortal } = services
  return {
    overview: req => parentPortal.overview(req.user.id),
    classes: async req => ({ items: await parentPortal.classes(req.user.id) }),
  }
}

module.exports = { createOverviewController }
