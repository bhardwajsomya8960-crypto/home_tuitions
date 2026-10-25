const { addDays } = require('../../shared/utils/dates')
const { mapSeries } = require('../../shared/utils/async')

// Read models and actions for the parent portal. Every query is scoped to the signed-in parent;
// ownership is checked here, not in the browser.
function createParentPortalService(ctx, { views, parents, assignments, enrolments, billing, demos }) {
  const { repo } = ctx

  async function ownLead(parentId, leadId) {
    const lead = await repo.get('Lead', leadId)
    if (!lead || lead.parentId !== parentId) throw ctx.notFound('Request')
    return lead
  }

  async function ownDemo(parentId, demoId) {
    const demo = await repo.get('Demo', demoId)
    if (!demo) throw ctx.notFound('Demo')
    await ownLead(parentId, demo.leadId)
    return demo
  }

  const self = {
    async overview(parentId) {
      await assignments.expireOffers()
      const parent = await parents.getParent(parentId)
      const leads = await mapSeries(await repo.find('Lead', { parentId }), views.parentLead)
      const all = await repo.find('Enrolment', { parentId })
      const upcoming = await enrolments.sessionsFor(all.filter(e => e.status === 'active'), { from: ctx.today(), to: addDays(ctx.today(), 14) })
      const invoices = await mapSeries(await repo.find('Invoice', { parentId }), billing.invoiceView)
      return {
        parent: { id: parent.id, name: parent.name, phone: parent.phone, email: parent.email, relationship: parent.relationship, address: parent.address, pincode: parent.pincode },
        students: await parents.listStudents(parentId),
        requests: leads,
        upcomingClasses: await mapSeries(upcoming.filter(s => s.status === 'scheduled'), enrolments.sessionView),
        invoices,
        stats: {
          students: await repo.count('Student', { parentId }),
          activeEnrolments: all.filter(e => e.status === 'active').length,
          openRequests: leads.filter(l => !['converted', 'lost', 'cancelled'].includes(l.status)).length,
          amountDue: invoices.reduce((sum, i) => sum + i.outstanding, 0),
        },
      }
    },

    async classes(parentId) {
      const sessions = await enrolments.sessionsFor(await repo.find('Enrolment', { parentId }))
      return (await mapSeries(sessions, enrolments.sessionView)).reverse()
    },

    async cancelRequest(parentId, leadId, reason) {
      const lead = await ownLead(parentId, leadId)
      const view = await views.parentLead(lead)
      if (!view.canCancel) throw ctx.conflict('CANNOT_CANCEL', 'This request can no longer be cancelled here. Contact support.')
      if (reason !== undefined && (typeof reason !== 'string' || reason.length > 500)) throw ctx.invalid([{ field: 'reason', message: 'must be text up to 500 characters' }])
      await repo.transaction(async () => {
        for (const a of await repo.find('Assignment', { leadId, status: ['offered', 'accepted', 'confirmed'] })) {
          await repo.update('Assignment', a.id, { status: a.status === 'offered' ? 'withdrawn' : 'released', updatedAt: ctx.iso() })
        }
        for (const d of await repo.find('Demo', { leadId, status: 'scheduled' })) await repo.update('Demo', d.id, { status: 'cancelled', updatedAt: ctx.iso() })
        if (!(await ctx.moveLead(lead, 'cancelled', `parent:${parentId}`, { note: reason || 'Cancelled by the parent' }))) {
          throw ctx.conflict('STALE', 'This request has just changed. Reload and try again.')
        }
      })
      return views.parentLead(await repo.get('Lead', leadId))
    },

    async demoOutcome(parentId, demoId, outcome) {
      const demo = await ownDemo(parentId, demoId)
      await demos.setOutcome(demoId, outcome, `parent:${parentId}`)
      return views.parentLead(await repo.get('Lead', demo.leadId))
    },

    async rescheduleRequest(parentId, demoId, message) {
      const demo = await ownDemo(parentId, demoId)
      if (demo.status !== 'scheduled') throw ctx.conflict('DEMO_CLOSED', 'Only a scheduled demo can be moved')
      if (typeof message !== 'string' || message.trim().length < 3 || message.length > 500) throw ctx.invalid([{ field: 'message', message: 'Tell us a suitable time (3 to 500 characters)' }])
      await ctx.event(demo.leadId, 'reschedule_requested', `parent:${parentId}`, { note: message.trim() })
      return { ok: true }
    },
  }
  return self
}

module.exports = { createParentPortalService }
