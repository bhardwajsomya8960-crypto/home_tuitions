// Lead offers: accept, decline, not available, or ask a question.
function createOffersController({ services }) {
  const { assignments, views } = services
  const asView = async promise => views.tutorOffer(await promise)
  return {
    accept: req => asView(assignments.accept(req.params.id, req.user.id)),
    reject: req => asView(assignments.decline(req.params.id, req.user.id, req.body)),
    unavailable: req => asView(assignments.decline(req.params.id, req.user.id, req.body, { unavailable: true })),
    requestInfo: req => asView(assignments.requestInfo(req.params.id, req.user.id, req.body?.message)),
  }
}

module.exports = { createOffersController }
