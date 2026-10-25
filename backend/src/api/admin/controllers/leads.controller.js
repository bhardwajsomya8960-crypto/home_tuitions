const ACTOR = 'admin'

// The lead CRM: list, create (phone/walk-in), open, status, notes and location.
function createLeadsController({ services }) {
  const { leads, assignments } = services
  return {
    list: req => leads.listLeads(req.query),
    create: async req => leads.leadDetail((await leads.createStaffLead(req.body, ACTOR)).id),
    async detail(req) {
      await assignments.expireOffers()
      return leads.leadDetail(req.params.id)
    },
    changeStatus: req => leads.changeLeadStatus(req.params.id, req.body, ACTOR),
    addNote: req => leads.addLeadNote(req.params.id, req.body?.note, ACTOR),
    updateLocation: req => leads.updateLeadLocation(req.params.id, req.body, ACTOR),
  }
}

module.exports = { createLeadsController }
