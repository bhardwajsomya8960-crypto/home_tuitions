// Tutor registration (public, needs a verified phone token) and the tutor's own profile.
function createAccountController({ services, authService }) {
  const { tutors } = services
  return {
    async register(req) {
      const tutor = await tutors.registerTutor(req.body, authService)
      return { token: authService.issueSession('tutor', tutor.id), tutor: { id: tutor.id, name: tutor.name, status: tutor.status } }
    },
    updateProfile: req => tutors.updateTutor(req.user.id, req.body),
  }
}

module.exports = { createAccountController }
