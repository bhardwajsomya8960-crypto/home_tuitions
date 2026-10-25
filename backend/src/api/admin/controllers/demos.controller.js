const ACTOR = 'admin'

// Demo classes. Each action returns the updated lead.
function createDemosController({ services }) {
  const { leads, demos } = services
  const leadOf = async promise => leads.leadDetail((await promise).leadId)
  return {
    async schedule(req) {
      await demos.scheduleDemo(req.params.id, req.body, ACTOR)
      return leads.leadDetail(req.params.id)
    },
    reschedule: req => leadOf(demos.rescheduleDemo(req.params.id, req.body?.scheduledAt, ACTOR)),
    complete: req => leadOf(demos.completeDemo(req.params.id, req.body, ACTOR)),
    outcome: req => leadOf(demos.setOutcome(req.params.id, req.body?.outcome, ACTOR)),
    noShow: req => leadOf(demos.markNoShow(req.params.id, req.body?.party, ACTOR)),
    cancel: req => leadOf(demos.cancelDemo(req.params.id, ACTOR, req.body?.note)),
  }
}

module.exports = { createDemosController }
