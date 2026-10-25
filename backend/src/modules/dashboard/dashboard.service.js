const M = require('../../shared/masters')
const { addDays } = require('../../shared/utils/dates')
const { mapSeries } = require('../../shared/utils/async')

// Staff overview (blueprint §18) and the operations work queues (§10.6).
function createDashboardService(ctx, { views }) {
  const { repo } = ctx

  return {
    async dashboard() {
      const leads = await repo.countBy('Lead', 'status')
      const tutors = await repo.countBy('Tutor', 'status')
      const totalLeads = Object.values(leads).reduce((a, b) => a + b, 0)
      const { collected, outstanding } = await repo.invoiceTotals()
      const weekAhead = addDays(ctx.today(), 7)
      return {
        leads: { total: totalLeads, byStatus: Object.fromEntries(M.LEAD_STATUSES.map(s => [s, leads[s] || 0])) },
        conversionRate: totalLeads ? Math.round(((leads.converted || 0) / totalLeads) * 1000) / 10 : 0,
        tutors: { total: Object.values(tutors).reduce((a, b) => a + b, 0), byStatus: tutors, awaitingReview: (tutors.documents_submitted || 0) + (tutors.under_review || 0) },
        operations: {
          openOffers: await repo.count('Assignment', { status: 'offered' }),
          awaitingConfirmation: await repo.count('Assignment', { status: 'accepted' }),
          noTutorQueue: await repo.count('Lead', { noTutorFound: true, status: ['matching', 'tutor_offered'] }),
          upcomingDemos: (await repo.find('Demo', { status: 'scheduled' })).filter(d => d.scheduledAt.slice(0, 10) <= weekAhead).length,
        },
        enrolments: { active: await repo.count('Enrolment', { status: 'active' }) },
        finance: { collected, outstanding, overdue: await repo.overdueTotal(ctx.today()) },
      }
    },

    async operations() {
      const leadCode = async id => (await repo.get('Lead', id))?.code
      const tutorName = async id => (await repo.get('Tutor', id))?.name
      const withNames = async a => ({ ...a, leadCode: await leadCode(a.leadId), tutorName: await tutorName(a.tutorId) })
      const escalatedLeadIds = [...new Set((await repo.find('LeadEvent', { type: 'escalated' })).map(e => e.leadId))]
      const escalated = (await mapSeries(escalatedLeadIds, id => repo.get('Lead', id))).filter(l => l && !['converted', 'lost', 'cancelled'].includes(l.status))
      return {
        openOffers: await mapSeries(await repo.find('Assignment', { status: 'offered' }, { sort: { expiresAt: 1 } }), withNames),
        awaitingConfirmation: await mapSeries(await repo.find('Assignment', { status: 'accepted' }, { sort: { respondedAt: 1 } }), withNames),
        infoRequests: await mapSeries((await repo.find('Assignment', { status: 'offered' })).filter(a => a.infoRequest), withNames),
        noTutor: await mapSeries(await repo.find('Lead', { noTutorFound: true, status: ['matching', 'tutor_offered'] }), views.leadSummary),
        escalations: await mapSeries(escalated, views.leadSummary),
        upcomingDemos: await mapSeries(await repo.find('Demo', { status: 'scheduled' }, { sort: { scheduledAt: 1 } }), async d => ({ ...d, leadCode: await leadCode(d.leadId), tutorName: await tutorName(d.tutorId) })),
      }
    },
  }
}

module.exports = { createDashboardService }
