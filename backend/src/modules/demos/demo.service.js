const specs = require('./demo.validation')
const { istLabel } = require('../../shared/utils/dates')

// Demo classes (blueprint §12.4): scheduling, rescheduling, completion, outcome and no-shows.
function createDemoService(ctx, { assignments }) {
  const { repo } = ctx

  const requireDemo = demoId => ctx.require('Demo', demoId, 'Demo')
  const leadOf = demo => repo.get('Lead', demo.leadId)

  const self = {
    async scheduleDemo(leadId, body, actor) {
      const v = ctx.validate(body, specs.demoSpec)
      const lead = await ctx.require('Lead', leadId, 'Lead')
      if (lead.status !== 'tutor_accepted') throw ctx.conflict('LEAD_NOT_READY', 'A demo can be scheduled once a tutor has accepted the lead')
      const assignment = await assignments.activeAssignment(leadId)
      if (!assignment) throw ctx.conflict('NO_TUTOR', 'No tutor is assigned to this lead')
      if (Date.parse(v.scheduledAt) < ctx.now().getTime()) throw ctx.invalid([{ field: 'scheduledAt', message: 'must be in the future' }])
      if (v.mode === 'home' && lead.mode === 'online') throw ctx.invalid([{ field: 'mode', message: 'this is an online-only request' }])
      const settings = await ctx.settings()

      return repo.transaction(async () => {
        // Scheduling is the operations approval, so it also confirms the tutor.
        if (assignment.status === 'accepted') await assignments.confirm(assignment.id, actor)
        const stamp = ctx.iso()
        const demo = await repo.insert('Demo', {
          id: ctx.newId(), leadId, tutorId: assignment.tutorId, scheduledAt: new Date(v.scheduledAt).toISOString(),
          durationMin: v.durationMinutes || settings.demoDurationMinutes, mode: v.mode, locationNote: v.locationNote || null,
          status: 'scheduled', rescheduleCount: 0, createdAt: stamp, updatedAt: stamp,
        })
        await ctx.moveLead(lead, 'demo_scheduled', actor, { type: 'demo_scheduled', note: `Demo on ${istLabel(demo.scheduledAt)} IST` })
        await ctx.audit(actor, 'demo.schedule', 'demo', demo.id)
        return demo
      })
    },

    async rescheduleDemo(demoId, scheduledAt, actor) {
      const demo = await requireDemo(demoId)
      if (demo.status !== 'scheduled') throw ctx.conflict('DEMO_CLOSED', 'Only a scheduled demo can be moved')
      const v = ctx.validate({ scheduledAt }, { scheduledAt: specs.demoSpec.scheduledAt })
      if (Date.parse(v.scheduledAt) < ctx.now().getTime()) throw ctx.invalid([{ field: 'scheduledAt', message: 'must be in the future' }])
      await repo.update('Demo', demo.id, { scheduledAt: new Date(v.scheduledAt).toISOString(), rescheduleCount: demo.rescheduleCount + 1, updatedAt: ctx.iso() })
      await ctx.event(demo.leadId, 'demo_rescheduled', actor, { note: `Moved to ${istLabel(v.scheduledAt)} IST` })
      await ctx.audit(actor, 'demo.reschedule', 'demo', demo.id)
      return requireDemo(demo.id)
    },

    async completeDemo(demoId, body, actor) {
      const v = ctx.validate(body || {}, specs.demoCompleteSpec)
      const demo = await requireDemo(demoId)
      if (demo.status !== 'scheduled') throw ctx.conflict('DEMO_CLOSED', 'This demo is not scheduled')
      await repo.update('Demo', demo.id, { status: 'completed', outcome: v.outcome || null, notes: v.notes || demo.notes, updatedAt: ctx.iso() })
      await ctx.moveLead(await leadOf(demo), 'demo_completed', actor, { type: 'demo_completed', note: v.notes })
      if (v.outcome) await self.applyOutcome(demo.id, v.outcome, actor)
      await ctx.audit(actor, 'demo.complete', 'demo', demo.id, { outcome: v.outcome })
      return requireDemo(demo.id)
    },

    // Records what the parent decided after the demo. "Wants a different tutor" releases the
    // tutor and returns the lead to matching.
    async setOutcome(demoId, outcome, actor) {
      const v = ctx.validate({ outcome }, { outcome: { ...specs.demoCompleteSpec.outcome, required: true } })
      const demo = await requireDemo(demoId)
      if (demo.status !== 'completed') throw ctx.conflict('DEMO_NOT_COMPLETED', 'The outcome can be recorded after the demo')
      if ((await leadOf(demo)).status !== 'demo_completed') throw ctx.conflict('OUTCOME_LOCKED', 'This request has already moved on')
      await repo.update('Demo', demo.id, { outcome: v.outcome, updatedAt: ctx.iso() })
      await self.applyOutcome(demo.id, v.outcome, actor)
      return requireDemo(demo.id)
    },

    async applyOutcome(demoId, outcome, actor) {
      const demo = await requireDemo(demoId)
      await ctx.event(demo.leadId, 'demo_outcome', actor, { note: outcome })
      if (outcome === 'tutor_change') {
        const a = await assignments.activeAssignment(demo.leadId)
        if (a) await assignments.release(a.id, actor, 'Parent asked for a different tutor')
      }
    },

    async markNoShow(demoId, party, actor) {
      if (!['parent', 'tutor'].includes(party)) throw ctx.invalid([{ field: 'party', message: 'must be parent or tutor' }])
      const demo = await requireDemo(demoId)
      if (demo.status !== 'scheduled') throw ctx.conflict('DEMO_CLOSED', 'This demo is not scheduled')
      await repo.update('Demo', demo.id, { status: `no_show_${party}`, updatedAt: ctx.iso() })
      const lead = await leadOf(demo)
      await ctx.moveLead(lead, 'tutor_accepted', actor, { type: 'demo_no_show', note: `${party === 'parent' ? 'Parent' : 'Tutor'} did not attend` })
      const noShows = (await repo.find('Demo', { leadId: lead.id })).filter(d => d.status.startsWith('no_show')).length
      if (noShows >= (await ctx.settings()).noShowEscalationThreshold) {
        await ctx.event(lead.id, 'escalated', 'system', { note: `${noShows} missed demos. Operations to follow up.` })
      }
      await ctx.audit(actor, 'demo.no_show', 'demo', demo.id, { party })
      return requireDemo(demo.id)
    },

    async cancelDemo(demoId, actor, note) {
      const demo = await requireDemo(demoId)
      if (demo.status !== 'scheduled') throw ctx.conflict('DEMO_CLOSED', 'This demo is not scheduled')
      await repo.update('Demo', demo.id, { status: 'cancelled', notes: note || demo.notes, updatedAt: ctx.iso() })
      await ctx.moveLead(await leadOf(demo), 'tutor_accepted', actor, { type: 'demo_cancelled', note })
      await ctx.audit(actor, 'demo.cancel', 'demo', demo.id)
      return requireDemo(demo.id)
    },
  }
  return self
}

module.exports = { createDemoService }
