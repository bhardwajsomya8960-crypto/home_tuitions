const M = require('../masters')
const specs = require('../operationsSpecs')
const { rankTutors, scoreTutor, needsLocation } = require('../matchingService')
const { timeOffOn, withoutBooked } = require('../availability')

const MATCHABLE = ['new', 'contacted', 'qualified', 'matching', 'tutor_offered', 'demo_completed']
const OPEN = 'offered'
// Staff may assign a tutor by hand once their documents are verified (business rule 2),
// even before they are activated for automatic offers.
const MANUALLY_ASSIGNABLE = ['verified', 'active']
const MANUAL_MODES = ['direct', 'offer']

function createAssignments(ctx) {
  const { repo } = ctx

  function budgetFor(lead) {
    const range = M.BUDGET_RANGES.find(b => b.value === lead.budgetRange)
    return range ? { min: range.min, max: range.max } : undefined
  }

  // Accepted vs declined/expired offers per tutor, for the acceptance-reliability factor.
  function offerStats() {
    const stats = {}
    for (const a of repo.find('assignments', {})) {
      const s = stats[a.tutorId] || (stats[a.tutorId] = { accepted: 0, declined: 0 })
      if (['accepted', 'confirmed', 'released'].includes(a.status)) s.accepted++
      else if (['rejected', 'expired', 'unavailable'].includes(a.status)) s.declined++
    }
    return stats
  }

  // Prepares a tutor for matching. Business rule 3: hours a tutor already teaches in (active
  // enrolments) are not free. A tutor on leave today is marked so matching can skip them.
  function forMatching(tutor) {
    const booked = repo.find('enrolments', { tutorId: tutor.id, status: 'active' }).flatMap(e => e.schedule)
    const leave = timeOffOn(tutor.timeOff, ctx.today())
    return { ...tutor, availability: withoutBooked(tutor.availability, booked), onLeaveUntil: leave ? leave.to : null }
  }

  function rank(lead) {
    const settings = ctx.settings()
    const tutors = repo.find('tutors', { status: 'active' }).map(forMatching)
    return { settings, ...rankTutors(lead, tutors, settings, { budget: budgetFor(lead), statsByTutor: offerStats() }) }
  }

  const offeredTutorIds = leadId => new Set(repo.find('assignments', { leadId }).map(a => a.tutorId))
  const openOffers = leadId => repo.find('assignments', { leadId, status: OPEN })

  function insertOffer(lead, result, { matchRunId, rankNo, actor }) {
    const settings = ctx.settings()
    const offeredAt = ctx.now()
    const assignment = repo.insert('assignments', {
      id: ctx.newId(), leadId: lead.id, tutorId: result.tutorId, matchRunId, rank: rankNo,
      score: result.score, distanceKm: result.distanceKm, factors: result.factors, reasons: result.reasons,
      status: OPEN, offeredAt: offeredAt.toISOString(),
      expiresAt: new Date(offeredAt.getTime() + settings.offerTimeoutMinutes * 60000).toISOString(),
      createdAt: offeredAt.toISOString(), updatedAt: offeredAt.toISOString(),
    })
    const tutor = repo.get('tutors', result.tutorId)
    ctx.event(lead.id, 'offer_sent', actor, { note: `Offered to ${tutor.name} (score ${result.score})` })
    ctx.audit(actor, 'assignment.offer', 'assignment', assignment.id, { leadId: lead.id, tutorId: result.tutorId })
    return assignment
  }

  const self = {
    // Runs the matching engine and stores the ranked result (blueprint §13.5 steps 1–7, 14).
    runMatching(leadId, actor) {
      const lead = ctx.require('leads', leadId, 'Lead')
      if (!MATCHABLE.includes(lead.status)) throw ctx.conflict('LEAD_NOT_MATCHABLE', `A lead in status "${lead.status}" cannot be matched`)
      if (needsLocation(lead.mode) && lead.latitude === null && !lead.pincode) {
        throw ctx.conflict('LOCATION_REQUIRED', 'Add the address or map location before matching a home-tuition lead')
      }
      const { settings, eligible, excluded } = rank(lead)
      const already = offeredTutorIds(lead.id)
      const results = eligible.map((r, i) => ({ ...r, rank: i + 1, previouslyOffered: already.has(r.tutorId) }))
      const run = repo.insert('match_runs', {
        id: ctx.newId(), leadId, settings, results, excludedCount: excluded.length, createdBy: actor, createdAt: ctx.iso(),
      })
      if (['new', 'contacted', 'qualified', 'demo_completed'].includes(lead.status)) ctx.moveLead(lead, 'matching', actor, { note: 'Matching started' })
      repo.update('leads', leadId, { noTutorFound: results.filter(r => !r.previouslyOffered).length === 0, updatedAt: ctx.iso() })
      ctx.event(leadId, 'matched', actor, { note: `${results.length} eligible tutor(s), ${excluded.length} excluded by filters` })
      if (results.length === 0) ctx.event(leadId, 'no_tutor_available', 'system', { note: 'No tutor met the requirement. Operations notified.' })
      return { run, lead: repo.get('leads', leadId), excludedReasons: summariseExclusions(excluded) }
    },

    latestRun(leadId) {
      return repo.find('match_runs', { leadId }, { limit: 1 })[0] || null
    },

    // Offers the lead to the next eligible tutors from the latest run, up to the simultaneous
    // limit, or to `tutorIds` when staff choose. Skips tutors already offered this lead and
    // tutors who are no longer eligible. Returns the new offers.
    offerNext(leadId, actor, { tutorIds } = {}) {
      return repo.transaction(() => {
        let lead = ctx.require('leads', leadId, 'Lead')
        if (!['matching', 'tutor_offered'].includes(lead.status)) throw ctx.conflict('LEAD_NOT_MATCHING', 'Run matching before sending offers')
        const run = self.latestRun(leadId)
        if (!run) throw ctx.conflict('NO_MATCH_RUN', 'Run matching before sending offers')

        const settings = ctx.settings()
        const open = openOffers(leadId)
        const slots = tutorIds ? tutorIds.length : settings.maxSimultaneousOffers - open.length
        const already = offeredTutorIds(leadId)
        const { eligible } = rank(lead)
        const fresh = new Map(eligible.map(r => [r.tutorId, r]))

        const pool = tutorIds
          ? tutorIds.map(id => {
            if (already.has(id)) throw ctx.conflict('ALREADY_OFFERED', 'This tutor has already been offered this lead')
            const r = fresh.get(id)
            if (!r) throw ctx.conflict('TUTOR_NOT_ELIGIBLE', 'This tutor is not eligible for this lead')
            return r
          })
          : run.results.map(r => fresh.get(r.tutorId)).filter(r => r && !already.has(r.tutorId))

        const created = pool.slice(0, Math.max(slots, 0)).map(r => insertOffer(lead, r, {
          matchRunId: run.id, rankNo: run.results.findIndex(x => x.tutorId === r.tutorId) + 1 || null, actor,
        }))

        if (created.length > 0) {
          if (lead.status === 'matching') lead = ctx.moveLead(lead, 'tutor_offered', actor, { note: 'Offer sequence started' }) || lead
          repo.update('leads', leadId, { noTutorFound: false, updatedAt: ctx.iso() })
        } else if (open.length === 0) {
          // Nothing left to offer: back to matching and flag for operations (business rule 10).
          if (lead.status === 'tutor_offered') ctx.moveLead(lead, 'matching', 'system', { note: 'All eligible tutors declined or did not respond' })
          if (!lead.noTutorFound) {
            repo.update('leads', leadId, { noTutorFound: true, updatedAt: ctx.iso() })
            ctx.event(leadId, 'no_tutor_available', 'system', { note: 'No more eligible tutors. Operations notified.' })
          }
        }
        return created
      })
    },

    // Closes offers past their window and moves each lead on (business rule 9).
    expireOffers() {
      const expired = repo.findExpiredOffers(ctx.iso())
      const leads = new Set()
      for (const a of expired) {
        const changed = repo.update('assignments', a.id, { status: 'expired', respondedAt: a.expiresAt, updatedAt: ctx.iso() }, { status: OPEN })
        if (!changed) continue
        const tutor = repo.get('tutors', a.tutorId)
        ctx.event(a.leadId, 'offer_expired', 'system', { note: `${tutor.name} did not respond in time` })
        leads.add(a.leadId)
      }
      for (const leadId of leads) {
        const lead = repo.get('leads', leadId)
        if (lead.status === 'tutor_offered') self.offerNext(leadId, 'system')
      }
      return expired.length
    },

    // ---- Tutor responses ---------------------------------------------------------------
    ownOffer(assignmentId, tutorId) {
      const a = repo.get('assignments', assignmentId)
      if (!a || a.tutorId !== tutorId) throw ctx.notFound('Offer')
      return a
    },

    accept(assignmentId, tutorId) {
      self.expireOffers()
      const a = self.ownOffer(assignmentId, tutorId)
      if (a.status === 'expired') throw ctx.conflict('OFFER_EXPIRED', 'This offer has expired')
      if (a.status !== OPEN) throw ctx.conflict('OFFER_CLOSED', 'This offer is no longer open')
      const actor = `tutor:${tutorId}`
      const settings = ctx.settings()

      const result = repo.transaction(() => {
        // First acceptance wins: both updates are conditional on the current status.
        const lead = repo.get('leads', a.leadId)
        if (lead.status !== 'tutor_offered') return { lost: true }
        if (!repo.update('assignments', a.id, { status: 'accepted', respondedAt: ctx.iso(), updatedAt: ctx.iso() }, { status: OPEN })) return { lost: true }
        if (!ctx.moveLead(lead, 'tutor_accepted', actor, { type: 'offer_accepted', note: 'Tutor accepted the offer' })) {
          throw ctx.conflict('OFFER_CLOSED', 'This lead has just been taken')
        }
        for (const other of openOffers(a.leadId)) {
          repo.update('assignments', other.id, { status: 'withdrawn', updatedAt: ctx.iso() }, { status: OPEN })
        }
        ctx.audit(actor, 'assignment.accept', 'assignment', a.id)
        if (settings.autoConfirmAssignments) self.confirm(a.id, 'system')
        return { lost: false }
      })
      if (result.lost) {
        repo.update('assignments', a.id, { status: 'withdrawn', updatedAt: ctx.iso() }, { status: OPEN })
        throw ctx.conflict('OFFER_CLOSED', 'Another tutor accepted this lead first')
      }
      return repo.get('assignments', a.id)
    },

    decline(assignmentId, tutorId, body, { unavailable = false } = {}) {
      self.expireOffers()
      const a = self.ownOffer(assignmentId, tutorId)
      if (a.status !== OPEN) throw ctx.conflict('OFFER_CLOSED', 'This offer is no longer open')
      const v = unavailable ? { reason: 'temporarily_unavailable', comment: body?.comment } : ctx.validate(body, specs.rejectOfferSpec)
      if (v.reason === 'other' && !v.comment) throw ctx.invalid([{ field: 'comment', message: 'Tell us briefly why' }])
      const status = unavailable ? 'unavailable' : 'rejected'
      if (!repo.update('assignments', a.id, { status, rejectReason: v.reason, rejectComment: v.comment || null, respondedAt: ctx.iso(), updatedAt: ctx.iso() }, { status: OPEN })) {
        throw ctx.conflict('OFFER_CLOSED', 'This offer is no longer open')
      }
      const tutor = repo.get('tutors', tutorId)
      const label = M.REJECT_REASONS.find(r => r.value === v.reason)?.label || v.reason
      ctx.event(a.leadId, unavailable ? 'offer_unavailable' : 'offer_rejected', `tutor:${tutorId}`, { note: `${tutor.name}: ${label}${v.comment ? ` — ${v.comment}` : ''}` })
      ctx.audit(`tutor:${tutorId}`, `assignment.${status}`, 'assignment', a.id, { reason: v.reason })
      self.offerNext(a.leadId, 'system')
      return repo.get('assignments', a.id)
    },

    requestInfo(assignmentId, tutorId, message) {
      const a = self.ownOffer(assignmentId, tutorId)
      if (a.status !== OPEN) throw ctx.conflict('OFFER_CLOSED', 'This offer is no longer open')
      if (typeof message !== 'string' || message.trim().length < 3 || message.length > 500) {
        throw ctx.invalid([{ field: 'message', message: 'must be 3 to 500 characters' }])
      }
      repo.update('assignments', a.id, { infoRequest: message.trim(), updatedAt: ctx.iso() })
      ctx.event(a.leadId, 'info_requested', `tutor:${tutorId}`, { note: message.trim() })
      return repo.get('assignments', a.id)
    },

    // ---- Operations ---------------------------------------------------------------------
    // Approving an accepted assignment reveals contact details to both sides (§13.6).
    confirm(assignmentId, actor) {
      const a = ctx.require('assignments', assignmentId, 'Assignment')
      if (a.status === 'confirmed') return a
      if (!repo.update('assignments', a.id, { status: 'confirmed', confirmedAt: ctx.iso(), updatedAt: ctx.iso() }, { status: 'accepted' })) {
        throw ctx.conflict('NOT_ACCEPTED', 'Only an accepted assignment can be confirmed')
      }
      ctx.event(a.leadId, 'assignment_confirmed', actor, { note: 'Tutor confirmed; contact details shared' })
      ctx.audit(actor, 'assignment.confirm', 'assignment', a.id)
      return repo.get('assignments', a.id)
    },

    // Frees the tutor and puts the lead back into matching (e.g. parent wants a different tutor).
    release(assignmentId, actor, note) {
      const a = ctx.require('assignments', assignmentId, 'Assignment')
      if (!['accepted', 'confirmed'].includes(a.status)) throw ctx.conflict('NOT_ASSIGNED', 'Only an accepted or confirmed assignment can be released')
      const lead = repo.get('leads', a.leadId)
      if (lead.status === 'converted') throw ctx.conflict('LEAD_CONVERTED', 'This lead is already an enrolment')
      if (repo.findOne('demos', { leadId: lead.id, status: 'scheduled' })) throw ctx.conflict('DEMO_SCHEDULED', 'Cancel the scheduled demo first')
      repo.update('assignments', a.id, { status: 'released', updatedAt: ctx.iso() })
      ctx.event(lead.id, 'assignment_released', actor, { note: note || 'Tutor released' })
      ctx.audit(actor, 'assignment.release', 'assignment', a.id)
      if (['tutor_accepted', 'demo_completed'].includes(lead.status)) ctx.moveLead(lead, 'matching', actor, { note: 'Looking for another tutor' })
      return repo.get('assignments', a.id)
    },

    // ---- Manual assignment (staff search by name) -------------------------------------
    // Finds tutors by name, phone or email and says how each one fits this lead: the match score
    // when they pass every filter, otherwise the reason they would not be matched automatically.
    searchTutorsForLead(leadId, query) {
      const lead = ctx.require('leads', leadId, 'Lead')
      const q = typeof query === 'string' ? query.trim().toLowerCase().slice(0, 80) : ''
      if (q.length < 2) throw ctx.invalid([{ field: 'q', message: 'Type at least 2 characters' }])
      const digits = q.replace(/\D/g, '')
      const settings = ctx.settings()
      const stats = offerStats()
      const already = offeredTutorIds(leadId)
      return repo.find('tutors', {}, { orderBy: 'name ASC' })
        .filter(t => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || (digits.length >= 3 && t.phone.includes(digits)))
        .slice(0, 20)
        .map(t => {
          const assignable = MANUALLY_ASSIGNABLE.includes(t.status)
          // Score as if active and taking leads, so the remaining filters still explain the fit.
          const fit = scoreTutor(lead, forMatching({ ...t, status: 'active', acceptingLeads: true }), settings, { budget: budgetFor(lead), stats: stats[t.id] })
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
    assignManually(leadId, body, actor) {
      const { tutorId, mode, reason } = body || {}
      const errors = []
      if (typeof tutorId !== 'string' || !tutorId) errors.push({ field: 'tutorId', message: 'Choose a tutor' })
      if (!MANUAL_MODES.includes(mode)) errors.push({ field: 'mode', message: 'must be direct or offer' })
      if (reason !== undefined && (typeof reason !== 'string' || reason.length > 500)) errors.push({ field: 'reason', message: 'must be text up to 500 characters' })
      if (errors.length) throw ctx.invalid(errors)

      return repo.transaction(() => {
        const lead = ctx.require('leads', leadId, 'Lead')
        if (self.activeAssignment(leadId)) throw ctx.conflict('ALREADY_ASSIGNED', 'This lead already has a tutor. Release them first.')
        if (!MATCHABLE.includes(lead.status) && lead.status !== 'on_hold') {
          throw ctx.conflict('LEAD_NOT_ASSIGNABLE', `A lead in status "${lead.status}" cannot be assigned`)
        }
        const tutor = ctx.require('tutors', tutorId, 'Tutor')
        if (!MANUALLY_ASSIGNABLE.includes(tutor.status)) {
          throw ctx.conflict('TUTOR_NOT_VERIFIED', `${tutor.name} is ${tutor.status.replace(/_/g, ' ')}. Only verified tutors can be assigned.`)
        }
        if (mode === 'offer' && repo.find('assignments', { leadId, tutorId, status: OPEN }).length) {
          throw ctx.conflict('ALREADY_OFFERED', `${tutor.name} already has an open offer for this lead`)
        }
        const fit = scoreTutor(lead, forMatching({ ...tutor, status: 'active', acceptingLeads: true }), ctx.settings(), { budget: budgetFor(lead), stats: offerStats()[tutorId] })
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
          for (const a of openOffers(leadId)) repo.update('assignments', a.id, { status: 'withdrawn', updatedAt: iso }, { status: OPEN })
          assignment = repo.insert('assignments', { ...base, status: 'confirmed', expiresAt: iso, respondedAt: iso, confirmedAt: iso })
          const moved = ctx.moveLead(lead, 'tutor_accepted', actor, { type: 'manual_assignment', note: `${tutor.name} assigned by staff${note ? `: ${note}` : ''}` })
          if (!moved) throw ctx.conflict('STALE', 'The lead changed while you were assigning. Reload and try again.')
          ctx.event(leadId, 'assignment_confirmed', actor, { note: 'Tutor confirmed; contact details shared' })
        } else {
          const expires = new Date(stamp.getTime() + ctx.settings().offerTimeoutMinutes * 60000).toISOString()
          assignment = repo.insert('assignments', { ...base, status: OPEN, expiresAt: expires })
          ctx.event(leadId, 'offer_sent', actor, { note: `Offered to ${tutor.name} by staff${note ? `: ${note}` : ''}` })
          if (lead.status !== 'tutor_offered') {
            if (!ctx.moveLead(lead, 'tutor_offered', actor, { note: 'Manual offer sent' })) throw ctx.conflict('STALE', 'The lead changed while you were assigning. Reload and try again.')
          }
        }
        repo.update('leads', leadId, { noTutorFound: false, updatedAt: iso })
        ctx.audit(actor, `assignment.manual_${mode}`, 'assignment', assignment.id, { leadId, tutorId, eligible: fit.eligible, reason: note || null })
        return assignment
      })
    },

    // The current accepted/confirmed assignment for a lead, if any.
    activeAssignment(leadId) {
      return repo.find('assignments', { leadId, status: ['accepted', 'confirmed'] })[0] || null
    },
  }
  return self
}

function summariseExclusions(excluded) {
  const counts = {}
  for (const e of excluded) counts[e.reason] = (counts[e.reason] || 0) + 1
  return Object.entries(counts).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count)
}

module.exports = { createAssignments }
