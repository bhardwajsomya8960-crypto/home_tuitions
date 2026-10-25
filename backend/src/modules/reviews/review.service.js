const specs = require('./review.validation')

// Parents rate the tutor once after the demo and once during tuition (blueprint §22).
// The tutor's average feeds the matching "quality" factor.
function createReviewService(ctx) {
  const { repo } = ctx

  return {
    async reviewTutor(parentId, leadId, body) {
      const v = ctx.validate(body, specs.reviewSpec)
      const lead = await ctx.require('Lead', leadId, 'Request')
      if (lead.parentId !== parentId) throw ctx.notFound('Request')
      const enrolment = await repo.findOne('Enrolment', { leadId })
      const demo = (await repo.find('Demo', { leadId, status: 'completed' }))[0]
      const stage = enrolment ? 'ongoing' : 'demo'
      const tutorId = enrolment ? enrolment.tutorId : demo?.tutorId
      if (!tutorId) throw ctx.conflict('NOTHING_TO_REVIEW', 'You can rate the tutor after the demo')
      if (await repo.findOne('Review', { parentId, leadId, stage })) throw ctx.conflict('ALREADY_REVIEWED', 'You have already rated this tutor at this stage')
      return repo.transaction(async () => {
        const review = await repo.insert('Review', { id: ctx.newId(), parentId, tutorId, leadId, stage, rating: v.rating, comment: v.comment || null, createdAt: ctx.iso() })
        const tutor = await repo.get('Tutor', tutorId)
        const count = tutor.ratingCount + 1
        const avg = ((tutor.ratingAvg || 0) * tutor.ratingCount + v.rating) / count
        await repo.update('Tutor', tutorId, { ratingAvg: Math.round(avg * 100) / 100, ratingCount: count })
        await ctx.audit(`parent:${parentId}`, 'review.create', 'tutor', tutorId, { rating: v.rating, stage })
        return review
      })
    },
  }
}

module.exports = { createReviewService }
