const { addDays } = require('../../shared/utils/dates')
const { mapSeries } = require('../../shared/utils/async')

// Read model for the tutor portal, scoped to the signed-in tutor.
function createTutorPortalService(ctx, { views, documents, assignments, enrolments }) {
  const { repo } = ctx

  return {
    async overview(tutorId) {
      await assignments.expireOffers()
      const tutor = await ctx.require('Tutor', tutorId, 'Tutor')
      const all = await repo.find('Assignment', { tutorId })
      const own = await repo.find('Enrolment', { tutorId })
      const sessions = await enrolments.sessionsFor(own.filter(e => e.status === 'active'), { to: addDays(ctx.today(), 14) })
      let classesCompleted = 0
      for (const e of own) classesCompleted += await repo.count('ClassSession', { enrolmentId: e.id, status: 'completed' })
      return {
        tutor: { ...tutor, documents: await documents.list(tutorId), requiredDocuments: documents.REQUIRED_DOCS },
        offers: await mapSeries(all.filter(a => a.status === 'offered'), views.tutorOffer),
        assignments: await mapSeries(all.filter(a => ['accepted', 'confirmed'].includes(a.status)), views.tutorOffer),
        history: await mapSeries(all.filter(a => !['offered', 'accepted', 'confirmed'].includes(a.status)).slice(0, 50), views.tutorOffer),
        demos: await mapSeries(await repo.find('Demo', { tutorId }, { sort: { scheduledAt: -1 } }), async d => {
          const lead = await repo.get('Lead', d.leadId)
          return { ...d, leadCode: lead.code, class: lead.class, subjects: lead.subjects }
        }),
        students: await mapSeries(own, async e => {
          const student = await repo.get('Student', e.studentId)
          const parent = await repo.get('Parent', e.parentId)
          const done = await repo.find('ClassSession', { enrolmentId: e.id, status: 'completed' })
          return {
            enrolmentId: e.id, status: e.status, studentName: student.name, class: student.class, board: student.board,
            subjects: e.subjects, mode: e.mode, schedule: e.schedule, startDate: e.startDate, parentName: parent.name, parentPhone: parent.phone,
            classesCompleted: done.length, attendanceRate: done.length ? Math.round((done.filter(s => s.studentPresent).length / done.length) * 100) : null,
          }
        }),
        classes: await mapSeries(sessions, enrolments.sessionView),
        stats: {
          openOffers: all.filter(a => a.status === 'offered').length,
          activeStudents: own.filter(e => e.status === 'active').length,
          classesCompleted,
          ratingAvg: tutor.ratingAvg,
          ratingCount: tutor.ratingCount,
        },
      }
    },
  }
}

module.exports = { createTutorPortalService }
