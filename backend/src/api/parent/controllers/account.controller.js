// Parent registration from the website enquiry form (needs a verified phone token).
function createAccountController({ services, authService }) {
  const { parents, views } = services
  return {
    async register(req) {
      const { parent, student, lead } = await parents.registerParent(req.body, authService)
      return {
        token: authService.issueSession('parent', parent.id),
        parent: { id: parent.id, name: parent.name },
        student: { id: student.id, name: student.name },
        lead: await views.parentLead(lead),
      }
    },
  }
}

module.exports = { createAccountController }
