const ACTOR = 'admin'

// Matching, offers, assigning a tutor by name, and confirming or releasing a tutor.
// Each action returns the updated lead so the lead screen can refresh in one step.
function createMatchingController({ services }) {
  const { leads, assignments, ctx } = services
  return {
    async runMatching(req) {
      await assignments.runMatching(req.params.id, ACTOR)
      return leads.leadDetail(req.params.id)
    },
    async sendOffers(req) {
      const tutorIds = req.body?.tutorIds
      if (tutorIds !== undefined && (!Array.isArray(tutorIds) || tutorIds.length === 0 || tutorIds.length > 10 || tutorIds.some(t => typeof t !== 'string'))) {
        throw ctx.invalid([{ field: 'tutorIds', message: 'must be a list of 1 to 10 tutor ids' }])
      }
      await assignments.offerNext(req.params.id, ACTOR, { tutorIds })
      return leads.leadDetail(req.params.id)
    },
    searchTutors: async req => ({ items: await assignments.searchTutorsForLead(req.params.id, req.query.q) }),
    async assign(req) {
      await assignments.assignManually(req.params.id, req.body, ACTOR)
      return leads.leadDetail(req.params.id)
    },
    confirm: async req => leads.leadDetail((await assignments.confirm(req.params.id, ACTOR)).leadId),
    release: async req => leads.leadDetail((await assignments.release(req.params.id, ACTOR, req.body?.note)).leadId),
  }
}

module.exports = { createMatchingController }
