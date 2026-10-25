function createClassesController({ services }) {
  const { enrolments } = services
  return {
    attendance: req => enrolments.recordAttendance(req.params.sessionId, req.user.id, req.body),
  }
}

module.exports = { createClassesController }
