function createOverviewController({ services }) {
  const { tutorPortal } = services
  return {
    overview: req => tutorPortal.overview(req.user.id),
  }
}

module.exports = { createOverviewController }
