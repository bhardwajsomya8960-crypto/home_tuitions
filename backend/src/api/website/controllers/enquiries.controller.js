// The public "request a callback" form for parents, students and tutors. No account needed.
function createEnquiriesController({ services }) {
  const { enquiries } = services
  return {
    async submit(req) {
      await enquiries.submit(req.body)
      // The response never says whether the number was already known.
      return { received: true }
    },
  }
}

module.exports = { createEnquiriesController }
