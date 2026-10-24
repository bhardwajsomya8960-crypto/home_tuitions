const M = require('../masters')

// What each audience may see. Tutors see an approximate location and no parent contact until
// the assignment is confirmed (blueprint §13.6, business rule 8). Parents see a tutor's public
// profile once a tutor has accepted, and contact details once confirmed.

const label = (list, value) => list.find(x => x.value === value)?.label || value

// Lead events shown to parents, with wording that does not reveal other tutors.
const PARENT_EVENTS = {
  created: () => 'Request received',
  status_changed: e => ({
    contacted: 'Our team contacted you', qualified: 'Requirement confirmed', matching: 'Looking for tutors near you',
    tutor_offered: 'Tutors are reviewing your request', on_hold: 'Request on hold', lost: 'Request closed',
    cancelled: 'Request cancelled', tutor_accepted: 'A tutor is available',
  })[e.toStatus],
  offer_accepted: () => 'A tutor accepted your request',
  assignment_confirmed: () => 'Tutor confirmed',
  assignment_released: () => 'Finding you another tutor',
  demo_scheduled: () => 'Demo scheduled',
  demo_rescheduled: () => 'Demo rescheduled',
  demo_completed: () => 'Demo completed',
  demo_no_show: () => 'Demo missed',
  demo_cancelled: () => 'Demo cancelled',
  converted: () => 'Classes started',
}

function createViews(ctx) {
  const { repo } = ctx

  function tutorPublic(tutor, { withContact }) {
    const view = {
      id: tutor.id, name: tutor.name, gender: tutor.gender, qualification: tutor.qualification,
      experienceYears: tutor.experienceYears, subjects: tutor.subjects, classes: tutor.classes, boards: tutor.boards,
      languages: tutor.languages, modes: tutor.modes, bio: tutor.bio, teachingMethod: tutor.teachingMethod,
      achievements: tutor.achievements, ratingAvg: tutor.ratingAvg, ratingCount: tutor.ratingCount,
    }
    if (withContact) Object.assign(view, { phone: tutor.phone, email: tutor.email })
    return view
  }

  const self = {
    tutorPublic,

    parentLead(lead) {
      const student = repo.get('students', lead.studentId)
      const assignment = repo.find('assignments', { leadId: lead.id, status: ['accepted', 'confirmed'] })[0]
      const tutor = assignment ? repo.get('tutors', assignment.tutorId) : null
      const demos = repo.find('demos', { leadId: lead.id }, { orderBy: 'scheduled_at DESC' })
      const enrolment = repo.findOne('enrolments', { leadId: lead.id })
      const timeline = repo.find('lead_events', { leadId: lead.id }, { orderBy: 'created_at ASC' })
        .map(e => ({ at: e.createdAt, text: PARENT_EVENTS[e.type]?.(e) }))
        .filter(e => e.text)
      const reviews = repo.find('reviews', { leadId: lead.id })
      return {
        id: lead.id, code: lead.code, status: lead.status, mode: lead.mode, subjects: lead.subjects,
        class: lead.class, board: lead.board, preferredDays: lead.preferredDays, preferredSlots: lead.preferredSlots,
        budgetRange: lead.budgetRange, startDate: lead.startDate, urgency: lead.urgency,
        specialRequirements: lead.specialRequirements, address: lead.address, pincode: lead.pincode, createdAt: lead.createdAt,
        student: student && { id: student.id, name: student.name },
        tutor: tutor ? { ...tutorPublic(tutor, { withContact: assignment.status === 'confirmed' }), confirmed: assignment.status === 'confirmed' } : null,
        demos: demos.map(d => ({ id: d.id, scheduledAt: d.scheduledAt, durationMin: d.durationMin, mode: d.mode, locationNote: d.locationNote, status: d.status, outcome: d.outcome })),
        enrolment: enrolment && { id: enrolment.id, status: enrolment.status, plan: enrolment.plan, feeAmount: enrolment.feeAmount, startDate: enrolment.startDate, schedule: enrolment.schedule },
        reviewedStages: reviews.map(r => r.stage),
        timeline,
        canCancel: ['new', 'contacted', 'qualified', 'matching', 'tutor_offered', 'tutor_accepted', 'on_hold'].includes(lead.status),
      }
    },

    // Lead as a tutor sees it in an offer. Contact details only after confirmation.
    tutorOffer(assignment) {
      const lead = repo.get('leads', assignment.leadId)
      const confirmed = assignment.status === 'confirmed'
      const view = {
        id: assignment.id, status: assignment.status, offeredAt: assignment.offeredAt, expiresAt: assignment.expiresAt,
        secondsLeft: assignment.status === 'offered' ? Math.max(0, Math.round((Date.parse(assignment.expiresAt) - ctx.now().getTime()) / 1000)) : 0,
        distanceKm: assignment.distanceKm, rejectReason: assignment.rejectReason, infoRequest: assignment.infoRequest,
        lead: {
          code: lead.code, class: lead.class, board: lead.board, subjects: lead.subjects, mode: lead.mode,
          locality: lead.pincode ? `Pincode ${lead.pincode}` : 'Online', preferredDays: lead.preferredDays,
          preferredSlots: lead.preferredSlots, budget: lead.budgetRange ? label(M.BUDGET_RANGES, lead.budgetRange) : null,
          startDate: lead.startDate, urgency: lead.urgency ? label(M.URGENCY, lead.urgency) : null,
          specialRequirements: lead.specialRequirements, prefLanguages: lead.prefLanguages,
        },
      }
      if (confirmed) {
        const parent = repo.get('parents', lead.parentId)
        const student = repo.get('students', lead.studentId)
        view.contact = { parentName: parent.name, phone: parent.phone, email: parent.email, studentName: student.name, address: lead.address }
      }
      return view
    },

    // Full lead for staff.
    adminLead(lead) {
      const parent = repo.get('parents', lead.parentId)
      const student = repo.get('students', lead.studentId)
      const tutorsById = {}
      const tutorName = id => (tutorsById[id] ||= repo.get('tutors', id))?.name
      const run = repo.find('match_runs', { leadId: lead.id }, { limit: 1 })[0]
      return {
        ...lead,
        parent, student,
        events: repo.find('lead_events', { leadId: lead.id }, { orderBy: 'created_at ASC' }),
        assignments: repo.find('assignments', { leadId: lead.id }, { orderBy: 'created_at ASC' }).map(a => ({ ...a, tutorName: tutorName(a.tutorId) })),
        latestMatch: run && { ...run, results: run.results.map(r => ({ ...r, tutorName: tutorName(r.tutorId) })) },
        demos: repo.find('demos', { leadId: lead.id }, { orderBy: 'scheduled_at DESC' }).map(d => ({ ...d, tutorName: tutorName(d.tutorId) })),
        enrolment: repo.findOne('enrolments', { leadId: lead.id }),
        allowedTransitions: M.MANUAL_LEAD_TRANSITIONS[lead.status] || [],
      }
    },

    leadSummary(lead) {
      const parent = repo.get('parents', lead.parentId)
      const student = repo.get('students', lead.studentId)
      return {
        id: lead.id, code: lead.code, status: lead.status, source: lead.source, mode: lead.mode, subjects: lead.subjects,
        class: lead.class, board: lead.board, pincode: lead.pincode, noTutorFound: lead.noTutorFound,
        urgency: lead.urgency, createdAt: lead.createdAt, updatedAt: lead.updatedAt,
        parentName: parent?.name, parentPhone: parent?.phone, studentName: student?.name,
      }
    },
  }
  return self
}

module.exports = { createViews }
