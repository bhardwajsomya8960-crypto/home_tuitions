function createClassesController({ services }) {
  const { enrolments } = services
  return {
    acknowledge: req => enrolments.acknowledgeSession(req.params.sessionId, req.user.id),
  }
}

module.exports = { createClassesController }
