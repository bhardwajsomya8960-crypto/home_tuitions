// A parent's tuition requests and the actions on them.
function createRequestsController({ services }) {
  const { parents, parentPortal, reviews, views } = services
  return {
    create: async req => views.parentLead(await parents.createRequest(req.user.id, req.body)),
    cancel: req => parentPortal.cancelRequest(req.user.id, req.params.leadId, req.body?.reason),
    review: req => reviews.reviewTutor(req.user.id, req.params.leadId, req.body),
  }
}

module.exports = { createRequestsController }
