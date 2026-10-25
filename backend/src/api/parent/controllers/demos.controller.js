// What the parent decides after a demo, and asking to move one.
function createDemosController({ services }) {
  const { parentPortal } = services
  return {
    outcome: req => parentPortal.demoOutcome(req.user.id, req.params.demoId, req.body?.outcome),
    rescheduleRequest: req => parentPortal.rescheduleRequest(req.user.id, req.params.demoId, req.body?.message),
  }
}

module.exports = { createDemosController }
