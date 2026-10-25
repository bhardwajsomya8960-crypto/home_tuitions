const ACTOR = 'admin'

// Website callback requests: the inbox, call notes and status. Turning one into a parent,
// request or tutor happens through those create routes with `enquiryId`.
function createEnquiriesController({ services }) {
  const { enquiries } = services
  return {
    list: req => enquiries.list(req.query),
    detail: req => enquiries.get(req.params.id),
    create: async req => enquiries.get((await enquiries.createByStaff(req.body, ACTOR)).id),
    update: req => enquiries.update(req.params.id, req.body, ACTOR),
  }
}

module.exports = { createEnquiriesController }
