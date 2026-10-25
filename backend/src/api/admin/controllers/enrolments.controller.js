const ACTOR = 'admin'

// Converting a lead after its demo, and managing ongoing enrolments.
function createEnrolmentsController({ services }) {
  const { leads, enrolments } = services
  return {
    async convert(req) {
      await enrolments.convertLead(req.params.id, req.body, ACTOR)
      return leads.leadDetail(req.params.id)
    },
    list: req => enrolments.listEnrolments(req.query),
    setStatus: req => enrolments.setEnrolmentStatus(req.params.id, req.body?.status, ACTOR),
  }
}

module.exports = { createEnrolmentsController }
