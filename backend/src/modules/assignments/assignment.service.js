const M = require('../../shared/masters')
const { mapSeries } = require('../../shared/utils/async')
const specs = require('./assignment.validation')
const { rankTutors, scoreTutor, needsLocation } = require('../matching/matching.engine')
const { timeOffOn, withoutBooked } = require('../matching/availability')

const MATCHABLE = ['new', 'contacted', 'qualified', 'matching', 'tutor_offered', 'demo_completed']
const OPEN = 'offered'
// Staff may assign a tutor by hand once their documents are verified (business rule 2),
// even before they are activated for automatic offers.
const MANUALLY_ASSIGNABLE = ['verified', 'active']
const MANUAL_MODES = ['direct', 'offer']

// Matching runs, timed offers to tutors and their responses, and manual assignment
// (blueprint §12.3, §13).
function createAssignmentService(ctx) {
  const { repo } = ctx

  function budgetFor(lead) {
    const range = M.BUDGET_RANGES.find(b => b.value === lead.budgetRange)
    return range ? { min: range.min, max: range.max } : undefined
  }

  // Accepted vs declined/expired offers per tutor, for the acceptance-reliability factor.
  async function offerStats() {
    const stats = {}
    for (const a of await repo.find('Assignment', {})) {
      const s = stats[a.tutorId] || (stats[a.tutorId] = { accepted: 0, declined: 0 })
      if (['accepted', 'confirmed', 'released'].includes(a.status)) s.accepted++
      else if (['rejected', 'expired', 'unavailable'].includes(a.status)) s.declined++
    }
    return stats
  }

  // Prepares a tutor for matching. Business rule 3: hours a tutor already teaches in (active
  // enrolments) are not free. A tutor on leave today is marked so matching can skip them.
  async function forMatching(tutor) {
    const booked = (await repo.find('Enrolment', { tutorId: tutor.id, status: 'active' })).flatMap(e => e.schedule)
    const leave = timeOffOn(tutor.timeOff, ctx.today())
    return { ...tutor, availability: withoutBooked(tutor.availability, booked), onLeaveUntil: leave ? leave.to : null }
  }

  async function rank(lead) {
    const settings = await ctx.settings()
    const tutors = await mapSeries(await repo.find('Tutor', { status: 'active' }), forMatching)
    return { settings, ...rankTutors(lead, tutors, settings, { budget: budgetFor(lead), statsByTutor: await offerStats() }) }
  }

  const offeredTutorIds = async leadId => new Set((await repo.find('Assignment', { leadId })).map(a => a.tutorId))
  const openOffers = leadId => repo.find('Assignment', { leadId, status: OPEN })

  async function insertOffer(lead, result, { matchRunId, rankNo, actor }) {
    const settings = await ctx.settings()
    const offeredAt = ctx.now()
    const assignment = await repo.insert('Assignment', {
      id: ctx.newId(), leadId: lead.id, tutorId: result.tutorId, matchRunId, rank: rankNo,
      score: result.score, distanceKm: result.distanceKm, factors: result.factors, reasons: result.reasons,
      status: OPEN, offeredAt: offeredAt.toISOString(),
      expiresAt: new Date(offeredAt.getTime() + settings.offerTimeoutMinutes * 60000).toISOString(),
      createdAt: offeredAt.toISOString(), updatedAt: offeredAt.toISOString(),
    })
    const tutor = await repo.get('Tutor', result.tutorId)
    await ctx.event(lead.id, 'offer_sent', actor, { note: `Offered to ${tutor.name} (score ${result.score})` })
    await ctx.audit(actor, 'assignment.offer', 'assignment', assignment.id, { leadId: lead.id, tutorId: result.tutorId })
    return assignment
  }

  const self = {
    // Runs the matching engine and stores the ranked result (blueprint §13.5 steps 1–7, 14).
    async runMatching(leadId, actor) {
      const lead = await ctx.require('Lead', leadId, 'Lead')
      if (!MATCHABLE.includes(lead.status)) throw ctx.conflict('LEAD_NOT_MATCHABLE', `A lead in status "${lead.status}" cannot be matched`)
      if (needsLocation(lead.mode) && lead.latitude === null && !lead.pincode) {
        throw ctx.conflict('LOCATION_REQUIRED', 'Add the address or map location before matching a home-tuition lead')
      }
      const { settings, eligible, excluded } = await rank(lead)
      const already = await offeredTutorIds(lead.id)
      const results = eligible.map((r, i) => ({ ...r, rank: i + 1, previouslyOffered: already.has(r.tutorId) }))
      const run = await repo.insert('MatchRun', {
        id: ctx.newId(), leadId, settings, results, excludedCount: excluded.length, createdBy: actor, createdAt: ctx.iso(),
      })
      if (['new', 'contacted', 'qualified', 'demo_completed'].includes(lead.status)) await ctx.moveLead(lead, 'matching', actor, { note: 'Matching started' })
      await repo.update('Lead', leadId, { noTutorFound: results.filter(r => !r.previouslyOffered).length === 0, updatedAt: ctx.iso() })
      await ctx.event(leadId, 'matched', actor, { note: `${results.length} eligible tutor(s), ${excluded.length} excluded by filters` })
      if (results.length === 0) await ctx.event(leadId, 'no_tutor_available', 'system', { note: 'No tutor met the requirement. Operations notified.' })
      return { run, lead: await repo.get('Lead', leadId), excludedReasons: summariseExclusions(excluded) }
    },

    latestRun(leadId) {
      return repo.findOne('MatchRun', { leadId })
    },

    // Offers the lead to the next eligible tutors from the latest run, up to the simultaneous
    // limit, or to `tutorIds` when staff choose. Skips tutors already offered this lead and
    // tutors who are no longer eligible. Returns the new offers.
    offerNext(leadId, actor, { tutorIds } = {}) {
      return repo.transaction(async () => {
        let lead = await ctx.require('Lead', leadId, 'Lead')
        if (!['matching', 'tutor_offered'].includes(lead.status)) throw ctx.conflict('LEAD_NOT_MATCHING', 'Run matching before sending offers')
        const run = await self.latestRun(leadId)
        if (!run) throw ctx.conflict('NO_MATCH_RUN', 'Run matching before sending offers')

        const settings = await ctx.settings()
        const open = await openOffers(leadId)
        const slots = tutorIds ? tutorIds.length : settings.maxSimultaneousOffers - open.length
        const already = await offeredTutorIds(leadId)
        const { eligible } = await rank(lead)
        const fresh = new Map(eligible.map(r => [r.tutorId, r]))

        const pool = tutorIds
          ? tutorIds.map(id => {
            if (already.has(id)) throw ctx.conflict('ALREADY_OFFERED', 'This tutor has already been offered this lead')
            const r = fresh.get(id)
            if (!r) throw ctx.conflict('TUTOR_NOT_ELIGIBLE', 'This tutor is not eligible for this lead')
            return r
          })
          : run.results.map(r => fresh.get(r.tutorId)).filter(r => r && !already.has(r.tutorId))

        const created = await mapSeries(pool.slice(0, Math.max(slots, 0)), r => insertOffer(lead, r, {
          matchRunId: run.id, rankNo: run.results.findIndex(x => x.tutorId === r.tutorId) + 1 || null, actor,
        }))

        if (created.length > 0) {
          if (lead.status === 'matching') lead = (await ctx.moveLead(lead, 'tutor_offered', actor, { note: 'Offer sequence started' })) || lead
          await repo.update('Lead', leadId, { noTutorFound: false, updatedAt: ctx.iso() })
        } else if (open.length === 0) {
          // Nothing left to offer: back to matching and flag for operations (business rule 10).
          if (lead.status === 'tutor_offered') await ctx.moveLead(lead, 'matching', 'system', { note: 'All eligible tutors declined or did not respond' })
          if (!lead.noTutorFound) {
            await repo.update('Lead', leadId, { noTutorFound: true, updatedAt: ctx.iso() })
            await ctx.event(leadId, 'no_tutor_available', 'system', { note: 'No more eligible tutors. Operations notified.' })
          }
        }
        return created
      })
    },

    // Closes offers past their window and moves each lead on (business rule 9).
    async expireOffers() {
      const expired = await repo.findExpiredOffers(ctx.iso())
      const leads = new Set()
      for (const a of expired) {
        const changed = await repo.update('Assignment', a.id, { status: 'expired', respondedAt: a.expiresAt, updatedAt: ctx.iso() }, { status: OPEN })
        if (!changed) continue
        const tutor = await repo.get('Tutor', a.tutorId)
        await ctx.event(a.leadId, 'offer_expired', 'system', { note: `${tutor.name} did not respond in time` })
        leads.add(a.leadId)
      }
      for (const leadId of leads) {
        const lead = await repo.get('Lead', leadId)
        if (lead.status === 'tutor_offered') await self.offerNext(leadId, 'system')
      }
      return expired.length
    },

    // ---- Tutor responses ---------------------------------------------------------------
    async ownOffer(assignmentId, tutorId) {
      const a = await repo.get('Assignment', assignmentId)
      if (!a || a.tutorId !== tutorId) throw ctx.notFound('Offer')
      return a
    },

    async accept(assignmentId, tutorId) {
      await self.expireOffers()
      const a = await self.ownOffer(assignmentId, tutorId)
      if (a.status === 'expired') throw ctx.conflict('OFFER_EXPIRED', 'This offer has expired')
      if (a.status !== OPEN) throw ctx.conflict('OFFER_CLOSED', 'This offer is no longer open')
      const actor = `tutor:${tutorId}`
      const settings = await ctx.settings()

      const result = await repo.transaction(async () => {
        // First acceptance wins: both updates are conditional on the current status.
        const lead = await repo.get('Lead', a.leadId)
        if (lead.status !== 'tutor_offered') return { lost: true }
        if (!(await repo.update('Assignment', a.id, { status: 'accepted', respondedAt: ctx.iso(), updatedAt: ctx.iso() }, { status: OPEN }))) return { lost: true }
        if (!(await ctx.moveLead(lead, 'tutor_accepted', actor, { type: 'offer_accepted', note: 'Tutor accepted the offer' }))) {
          throw ctx.conflict('OFFER_CLOSED', 'This lead has just been taken')
        }
        for (const other of await openOffers(a.leadId)) {
          await repo.update('Assignment', other.id, { status: 'withdrawn', updatedAt: ctx.iso() }, { status: OPEN })
        }
        await ctx.audit(actor, 'assignment.accept', 'assignment', a.id)
        if (settings.autoConfirmAssignments) await self.confirm(a.id, 'system')
        return { lost: false }
      })
      if (result.lost) {
        await repo.update('Assignment', a.id, { status: 'withdrawn', updatedAt: ctx.iso() }, { status: OPEN })
        throw ctx.conflict('OFFER_CLOSED', 'Another tutor accepted this lead first')
      }
      return repo.get('Assignment', a.id)
    },

    async decline(assignmentId, tutorId, body, { unavailable = false } = {}) {
      await self.expireOffers()
      const a = await self.ownOffer(assignmentId, tutorId)
      if (a.status !== OPEN) throw ctx.conflict('OFFER_CLOSED', 'This offer is no longer open')
      const v = unavailable ? { reason: 'temporarily_unavailable', comment: body?.comment } : ctx.validate(body, specs.rejectOfferSpec)
      if (v.reason === 'other' && !v.comment) throw ctx.invalid([{ field: 'comment', message: 'Tell us briefly why' }])
      const status = unavailable ? 'unavailable' : 'rejected'
      if (!(await repo.update('Assignment', a.id, { status, rejectReason: v.reason, rejectComment: v.comment || null, respondedAt: ctx.iso(), updatedAt: ctx.iso() }, { status: OPEN }))) {
        throw ctx.conflict('OFFER_CLOSED', 'This offer is no longer open')
      }
      const tutor = await repo.get('Tutor', tutorId)
      const label = M.REJECT_REASONS.find(r => r.value === v.reason)?.label || v.reason
      await ctx.event(a.leadId, unavailable ? 'offer_unavailable' : 'offer_rejected', `tutor:${tutorId}`, { note: `${tutor.name}: ${label}${v.comment ? ` — ${v.comment}` : ''}` })
      await ctx.audit(`tutor:${tutorId}`, `assignment.${status}`, 'assignment', a.id, { reason: v.reason })
      await self.offerNext(a.leadId, 'system')
      return repo.get('Assignment', a.id)
    },

    async requestInfo(assignmentId, tutorId, message) {
      const a = await self.ownOffer(assignmentId, tutorId)
      if (a.status !== OPEN) throw ctx.conflict('OFFER_CLOSED', 'This offer is no longer open')
      if (typeof message !== 'string' || message.trim().length < 3 || message.length > 500) {
        throw ctx.invalid([{ field: 'message', message: 'must be 3 to 500 characters' }])
      }
      await repo.update('Assignment', a.id, { infoRequest: message.trim(), updatedAt: ctx.iso() })
      await ctx.event(a.leadId, 'info_requested', `tutor:${tutorId}`, { note: message.trim() })
      return repo.get('Assignment', a.id)
    },

    // ---- Operations ---------------------------------------------------------------------
    // Approving an accepted assignment reveals contact details to both sides (§13.6).
    async confirm(assignmentId, actor) {
      const a = await ctx.require('Assignment', assignmentId, 'Assignment')
      if (a.status === 'confirmed') return a
      if (!(await repo.update('Assignment', a.id, { status: 'confirmed', confirmedAt: ctx.iso(), updatedAt: ctx.iso() }, { status: 'accepted' }))) {
        throw ctx.conflict('NOT_ACCEPTED', 'Only an accepted assignment can be confirmed')
      }
      await ctx.event(a.leadId, 'assignment_confirmed', actor, { note: 'Tutor confirmed; contact details shared' })
      await ctx.audit(actor, 'assignment.confirm', 'assignment', a.id)
      return repo.get('Assignment', a.id)
    },

    // Frees the tutor and puts the lead back into matching (e.g. parent wants a different tutor).
    async release(assignmentId, actor, note) {
      const a = await ctx.require('Assignment', assignmentId, 'Assignment')
      if (!['accepted', 'confirmed'].includes(a.status)) throw ctx.conflict('NOT_ASSIGNED', 'Only an accepted or confirmed assignment can be released')
      const lead = await repo.get('Lead', a.leadId)
      if (lead.status === 'converted') throw ctx.conflict('LEAD_CONVERTED', 'This lead is already an enrolment')
      if (await repo.findOne('Demo', { leadId: lead.id, status: 'scheduled' })) throw ctx.conflict('DEMO_SCHEDULED', 'Cancel the scheduled demo first')
      await repo.update('Assignment', a.id, { status: 'released', updatedAt: ctx.iso() })
      await ctx.event(lead.id, 'assignment_released', actor, { note: note || 'Tutor released' })
      await ctx.audit(actor, 'assignment.release', 'assignment', a.id)
      if (['tutor_accepted', 'demo_completed'].includes(lead.status)) await ctx.moveLead(lead, 'matching', actor, { note: 'Looking for another tutor' })
      return repo.get('Assignment', a.id)
    },

    // ---- Manual assignment (staff search by name) -------------------------------------
    // Finds tutors by name, phone or email and says how each one fits this lead: the match score
    // when they pass every filter, otherwise the reason they would not be matched automatically.
    async searchTutorsForLead(leadId, query) {
      const lead = await ctx.require('Lead', leadId, 'Lead')
      const q = typeof query === 'string' ? query.trim().toLowerCase().slice(0, 80) : ''
      if (q.length < 2) throw ctx.invalid([{ field: 'q', message: 'Type at least 2 characters' }])
      const digits = q.replace(/\D/g, '')
      const settings = await ctx.settings()
      const stats = await offerStats()
      const already = await offeredTutorIds(leadId)
      const matches = (await repo.find('Tutor', {}, { sort: { name: 1 } }))
        .filter(t => t.name.toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q) || (digits.length >= 3 && t.phone.includes(digits)))
        .slice(0, 20)
      return mapSeries(matches, async t => {
        const assignable = MANUALLY_ASSIGNABLE.includes(t.status)
        // Score as if active and taking leads, so the remaining filters still explain the fit.
        const fit = scoreTutor(lead, await forMatching({ ...t, status: 'active', acceptingLeads: true }), settings, { budget: budgetFor(lead), stats: stats[t.id] })
        return {
          id: t.id, name: t.name, phone: t.phone, status: t.status, acceptingLeads: t.acceptingLeads,
          subjects: t.subjects, classes: t.classes, modes: t.modes, pincode: t.pincode, experienceYears: t.experienceYears,
          assignable, previouslyOffered: already.has(t.id),
          eligible: assignable && fit.eligible, score: fit.eligible ? fit.score : null, distanceKm: fit.distanceKm ?? null,
          reason: !assignable ? `tutor is ${t.status.replace(/_/g, ' ')}` : fit.eligible ? null : fit.reason,
        }
      })
    },

    // Assigns a chosen tutor. "direct" confirms them straight away (for example, agreed on a
    // call); "offer" sends a timed offer they accept or decline. A tutor who fails the matching
    // filters can still be chosen, but staff must give a reason, which is recorded.
    async assignManually(leadId, body, actor) {
      const { tutorId, mode, reason } = body || {}
      const errors = []
      if (typeof tutorId !== 'string' || !tutorId) errors.push({ field: 'tutorId', message: 'Choose a tutor' })
      if (!MANUAL_MODES.includes(mode)) errors.push({ field: 'mode', message: 'must be direct or offer' })
      if (reason !== undefined && (typeof reason !== 'string' || reason.length > 500)) errors.push({ field: 'reason', message: 'must be text up to 500 characters' })
      if (errors.length) throw ctx.invalid(errors)

      return repo.transaction(async () => {
        const lead = await ctx.require('Lead', leadId, 'Lead')
        if (await self.activeAssignment(leadId)) throw ctx.conflict('ALREADY_ASSIGNED', 'This lead already has a tutor. Release them first.')
        if (!MATCHABLE.includes(lead.status) && lead.status !== 'on_hold') {
          throw ctx.conflict('LEAD_NOT_ASSIGNABLE', `A lead in status "${lead.status}" cannot be assigned`)
        }
        const tutor = await ctx.require('Tutor', tutorId, 'Tutor')
        if (!MANUALLY_ASSIGNABLE.includes(tutor.status)) {
          throw ctx.conflict('TUTOR_NOT_VERIFIED', `${tutor.name} is ${tutor.status.replace(/_/g, ' ')}. Only verified tutors can be assigned.`)
        }
        if (mode === 'offer' && (await repo.count('Assignment', { leadId, tutorId, status: OPEN }))) {
          throw ctx.conflict('ALREADY_OFFERED', `${tutor.name} already has an open offer for this lead`)
        }
        const settings = await ctx.settings()
        const fit = scoreTutor(lead, await forMatching({ ...tutor, status: 'active', acceptingLeads: true }), settings, { budget: budgetFor(lead), stats: (await offerStats())[tutorId] })
        const note = typeof reason === 'string' ? reason.trim() : ''
        if (!fit.eligible && note.length < 3) {
          throw ctx.invalid([{ field: 'reason', message: `${tutor.name} does not meet the requirement (${fit.reason}). Add a reason to assign anyway.` }])
        }

        const stamp = ctx.now()
        const iso = stamp.toISOString()
        const reasons = [`Assigned manually by staff${note ? `: ${note}` : ''}`, ...(fit.eligible ? fit.reasons : [`Override: ${fit.reason}`])]
        const base = {
          id: ctx.newId(), leadId, tutorId, matchRunId: null, rank: null,
          score: fit.eligible ? fit.score : 0, distanceKm: fit.distanceKm ?? null, factors: fit.factors || {}, reasons,
          offeredAt: iso, createdAt: iso, updatedAt: iso,
        }
        let assignment
        if (mode === 'direct') {
          // Other tutors waiting on this lead are told it has been filled.
          for (const a of await openOffers(leadId)) await repo.update('Assignment', a.id, { status: 'withdrawn', updatedAt: iso }, { status: OPEN })
          assignment = await repo.insert('Assignment', { ...base, status: 'confirmed', expiresAt: iso, respondedAt: iso, confirmedAt: iso })
          const moved = await ctx.moveLead(lead, 'tutor_accepted', actor, { type: 'manual_assignment', note: `${tutor.name} assigned by staff${note ? `: ${note}` : ''}` })
          if (!moved) throw ctx.conflict('STALE', 'The lead changed while you were assigning. Reload and try again.')
          await ctx.event(leadId, 'assignment_confirmed', actor, { note: 'Tutor confirmed; contact details shared' })
        } else {
          const expires = new Date(stamp.getTime() + settings.offerTimeoutMinutes * 60000).toISOString()
          assignment = await repo.insert('Assignment', { ...base, status: OPEN, expiresAt: expires })
          await ctx.event(leadId, 'offer_sent', actor, { note: `Offered to ${tutor.name} by staff${note ? `: ${note}` : ''}` })
          if (lead.status !== 'tutor_offered') {
            if (!(await ctx.moveLead(lead, 'tutor_offered', actor, { note: 'Manual offer sent' }))) throw ctx.conflict('STALE', 'The lead changed while you were assigning. Reload and try again.')
          }
        }
        await repo.update('Lead', leadId, { noTutorFound: false, updatedAt: iso })
        await ctx.audit(actor, `assignment.manual_${mode}`, 'assignment', assignment.id, { leadId, tutorId, eligible: fit.eligible, reason: note || null })
        return assignment
      })
    },

    // The current accepted/confirmed assignment for a lead, if any.
    async activeAssignment(leadId) {
      return (await repo.find('Assignment', { leadId, status: ['accepted', 'confirmed'] }))[0] || null
    },
  }
  return self
}

function summariseExclusions(excluded) {
  const counts = {}
  for (const e of excluded) counts[e.reason] = (counts[e.reason] || 0) + 1
  return Object.entries(counts).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count)
}

module.exports = { createAssignmentService }
