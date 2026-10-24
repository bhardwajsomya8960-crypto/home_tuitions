const specs = require('../operationsSpecs')

const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
const SESSION_HORIZON_DAYS = 14

const addDays = (date, n) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const istLabel = iso => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const monthLabel = date => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' })

function createDelivery(ctx, { assignments }) {
  const { repo } = ctx

  function requireDemo(demoId) {
    return ctx.require('demos', demoId, 'Demo')
  }

  function leadOf(demo) {
    return repo.get('leads', demo.leadId)
  }

  const self = {
    // ---- Demos (blueprint §12.4) -------------------------------------------------------
    scheduleDemo(leadId, body, actor) {
      const v = ctx.validate(body, specs.demoSpec)
      const lead = ctx.require('leads', leadId, 'Lead')
      if (lead.status !== 'tutor_accepted') throw ctx.conflict('LEAD_NOT_READY', 'A demo can be scheduled once a tutor has accepted the lead')
      const assignment = assignments.activeAssignment(leadId)
      if (!assignment) throw ctx.conflict('NO_TUTOR', 'No tutor is assigned to this lead')
      if (Date.parse(v.scheduledAt) < ctx.now().getTime()) throw ctx.invalid([{ field: 'scheduledAt', message: 'must be in the future' }])
      if (v.mode === 'home' && lead.mode === 'online') throw ctx.invalid([{ field: 'mode', message: 'this is an online-only request' }])

      return repo.transaction(() => {
        // Scheduling is the operations approval, so it also confirms the tutor.
        if (assignment.status === 'accepted') assignments.confirm(assignment.id, actor)
        const stamp = ctx.iso()
        const demo = repo.insert('demos', {
          id: ctx.newId(), leadId, tutorId: assignment.tutorId, scheduledAt: new Date(v.scheduledAt).toISOString(),
          durationMin: v.durationMinutes || ctx.settings().demoDurationMinutes, mode: v.mode, locationNote: v.locationNote || null,
          status: 'scheduled', rescheduleCount: 0, createdAt: stamp, updatedAt: stamp,
        })
        ctx.moveLead(lead, 'demo_scheduled', actor, { type: 'demo_scheduled', note: `Demo on ${istLabel(demo.scheduledAt)} IST` })
        ctx.audit(actor, 'demo.schedule', 'demo', demo.id)
        return demo
      })
    },

    rescheduleDemo(demoId, scheduledAt, actor) {
      const demo = requireDemo(demoId)
      if (demo.status !== 'scheduled') throw ctx.conflict('DEMO_CLOSED', 'Only a scheduled demo can be moved')
      const v = ctx.validate({ scheduledAt }, { scheduledAt: specs.demoSpec.scheduledAt })
      if (Date.parse(v.scheduledAt) < ctx.now().getTime()) throw ctx.invalid([{ field: 'scheduledAt', message: 'must be in the future' }])
      repo.update('demos', demo.id, { scheduledAt: new Date(v.scheduledAt).toISOString(), rescheduleCount: demo.rescheduleCount + 1, updatedAt: ctx.iso() })
      ctx.event(demo.leadId, 'demo_rescheduled', actor, { note: `Moved to ${istLabel(v.scheduledAt)} IST` })
      ctx.audit(actor, 'demo.reschedule', 'demo', demo.id)
      return requireDemo(demo.id)
    },

    completeDemo(demoId, body, actor) {
      const v = ctx.validate(body || {}, specs.demoCompleteSpec)
      const demo = requireDemo(demoId)
      if (demo.status !== 'scheduled') throw ctx.conflict('DEMO_CLOSED', 'This demo is not scheduled')
      repo.update('demos', demo.id, { status: 'completed', outcome: v.outcome || null, notes: v.notes || demo.notes, updatedAt: ctx.iso() })
      ctx.moveLead(leadOf(demo), 'demo_completed', actor, { type: 'demo_completed', note: v.notes })
      if (v.outcome) self.applyOutcome(demo.id, v.outcome, actor)
      ctx.audit(actor, 'demo.complete', 'demo', demo.id, { outcome: v.outcome })
      return requireDemo(demo.id)
    },

    // Records what the parent decided after the demo. "Wants a different tutor" releases the
    // tutor and returns the lead to matching.
    setOutcome(demoId, outcome, actor) {
      const v = ctx.validate({ outcome }, { outcome: { ...specs.demoCompleteSpec.outcome, required: true } })
      const demo = requireDemo(demoId)
      if (demo.status !== 'completed') throw ctx.conflict('DEMO_NOT_COMPLETED', 'The outcome can be recorded after the demo')
      if (leadOf(demo).status !== 'demo_completed') throw ctx.conflict('OUTCOME_LOCKED', 'This request has already moved on')
      repo.update('demos', demo.id, { outcome: v.outcome, updatedAt: ctx.iso() })
      self.applyOutcome(demo.id, v.outcome, actor)
      return requireDemo(demo.id)
    },

    applyOutcome(demoId, outcome, actor) {
      const demo = requireDemo(demoId)
      ctx.event(demo.leadId, 'demo_outcome', actor, { note: outcome })
      if (outcome === 'tutor_change') {
        const a = assignments.activeAssignment(demo.leadId)
        if (a) assignments.release(a.id, actor, 'Parent asked for a different tutor')
      }
    },

    markNoShow(demoId, party, actor) {
      if (!['parent', 'tutor'].includes(party)) throw ctx.invalid([{ field: 'party', message: 'must be parent or tutor' }])
      const demo = requireDemo(demoId)
      if (demo.status !== 'scheduled') throw ctx.conflict('DEMO_CLOSED', 'This demo is not scheduled')
      repo.update('demos', demo.id, { status: `no_show_${party}`, updatedAt: ctx.iso() })
      const lead = leadOf(demo)
      ctx.moveLead(lead, 'tutor_accepted', actor, { type: 'demo_no_show', note: `${party === 'parent' ? 'Parent' : 'Tutor'} did not attend` })
      const noShows = repo.find('demos', { leadId: lead.id }).filter(d => d.status.startsWith('no_show')).length
      if (noShows >= ctx.settings().noShowEscalationThreshold) {
        ctx.event(lead.id, 'escalated', 'system', { note: `${noShows} missed demos. Operations to follow up.` })
      }
      ctx.audit(actor, 'demo.no_show', 'demo', demo.id, { party })
      return requireDemo(demo.id)
    },

    cancelDemo(demoId, actor, note) {
      const demo = requireDemo(demoId)
      if (demo.status !== 'scheduled') throw ctx.conflict('DEMO_CLOSED', 'This demo is not scheduled')
      repo.update('demos', demo.id, { status: 'cancelled', notes: note || demo.notes, updatedAt: ctx.iso() })
      ctx.moveLead(leadOf(demo), 'tutor_accepted', actor, { type: 'demo_cancelled', note })
      ctx.audit(actor, 'demo.cancel', 'demo', demo.id)
      return requireDemo(demo.id)
    },

    // ---- Conversion & enrolment --------------------------------------------------------
    // Business rule 6: acceptance is not conversion. A lead converts only after a demo.
    convertLead(leadId, body, actor) {
      const v = ctx.validate(body, specs.conversionSpec)
      const lead = ctx.require('leads', leadId, 'Lead')
      if (lead.status !== 'demo_completed') throw ctx.conflict('LEAD_NOT_READY', 'A lead can be converted after its demo is completed')
      const assignment = assignments.activeAssignment(leadId)
      if (!assignment || assignment.status !== 'confirmed') throw ctx.conflict('NO_TUTOR', 'No confirmed tutor for this lead')

      return repo.transaction(() => {
        const stamp = ctx.iso()
        const enrolment = repo.insert('enrolments', {
          id: ctx.newId(), leadId, studentId: lead.studentId, parentId: lead.parentId, tutorId: assignment.tutorId,
          subjects: v.subjects || lead.subjects, mode: lead.mode, plan: v.plan, feeAmount: v.feeAmount,
          startDate: v.startDate, schedule: v.schedule, status: 'active', createdAt: stamp, updatedAt: stamp,
        })
        ctx.moveLead(lead, 'converted', actor, { type: 'converted', note: `Enrolment created (${v.plan}, ₹${v.feeAmount})` })
        const periodLabel = { monthly: `Fees for ${monthLabel(v.startDate)}`, quarterly: `Quarter from ${monthLabel(v.startDate)}`, one_time: 'Course fee', custom: 'First payment' }[v.plan]
        self.createInvoice({ enrolmentId: enrolment.id, amount: v.feeAmount, periodLabel, dueDate: addDays(v.startDate, 7) }, actor)
        self.ensureSessions(enrolment)
        ctx.audit(actor, 'enrolment.create', 'enrolment', enrolment.id, { leadId })
        return enrolment
      })
    },

    setEnrolmentStatus(enrolmentId, status, actor) {
      const allowed = { active: ['paused', 'completed', 'cancelled'], paused: ['active', 'cancelled'] }
      const e = ctx.require('enrolments', enrolmentId, 'Enrolment')
      if (!(allowed[e.status] || []).includes(status)) throw ctx.conflict('INVALID_TRANSITION', `An enrolment that is ${e.status} cannot become ${status}`)
      repo.update('enrolments', e.id, { status, updatedAt: ctx.iso() })
      if (status !== 'active') {
        for (const s of repo.find('class_sessions', { enrolmentId: e.id, status: 'scheduled' })) {
          if (s.scheduledDate >= ctx.today()) repo.update('class_sessions', s.id, { status: 'cancelled', updatedAt: ctx.iso() })
        }
      }
      ctx.audit(actor, 'enrolment.status', 'enrolment', e.id, { from: e.status, to: status })
      return repo.get('enrolments', e.id)
    },

    // Creates scheduled sessions for an active enrolment up to two weeks ahead. Safe to call
    // repeatedly: existing sessions are left as they are.
    ensureSessions(enrolment) {
      if (enrolment.status !== 'active') return
      const from = enrolment.startDate > ctx.today() ? enrolment.startDate : ctx.today()
      const until = addDays(ctx.today() > enrolment.startDate ? ctx.today() : enrolment.startDate, SESSION_HORIZON_DAYS)
      const existing = new Set(repo.find('class_sessions', { enrolmentId: enrolment.id }).map(s => `${s.scheduledDate}:${s.slot}`))
      for (let date = from; date <= until; date = addDays(date, 1)) {
        const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
        for (const entry of enrolment.schedule) {
          if (DAY_INDEX[entry.day] !== weekday || existing.has(`${date}:${entry.slot}`)) continue
          const stamp = ctx.iso()
          repo.insert('class_sessions', { id: ctx.newId(), enrolmentId: enrolment.id, scheduledDate: date, slot: entry.slot, status: 'scheduled', createdAt: stamp, updatedAt: stamp })
        }
      }
    },

    sessionsFor(enrolments, { from, to } = {}) {
      const out = []
      for (const e of enrolments) {
        self.ensureSessions(e)
        for (const s of repo.find('class_sessions', { enrolmentId: e.id }, { orderBy: 'scheduled_date ASC, slot ASC' })) {
          if (from && s.scheduledDate < from) continue
          if (to && s.scheduledDate > to) continue
          out.push({ ...s, enrolment: e })
        }
      }
      return out.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    },

    recordAttendance(sessionId, tutorId, body) {
      const v = ctx.validate(body, specs.attendanceSpec)
      const session = ctx.require('class_sessions', sessionId, 'Class')
      const enrolment = repo.get('enrolments', session.enrolmentId)
      if (enrolment.tutorId !== tutorId) throw ctx.notFound('Class')
      if (session.status === 'cancelled') throw ctx.conflict('CLASS_CANCELLED', 'This class was cancelled')
      if (session.scheduledDate > ctx.today()) throw ctx.conflict('CLASS_IN_FUTURE', 'Attendance can be recorded on or after the class date')
      repo.update('class_sessions', session.id, {
        status: 'completed', tutorPresent: v.tutorPresent, studentPresent: v.studentPresent,
        notes: v.notes || null, homework: v.homework || null, updatedAt: ctx.iso(),
      })
      ctx.audit(`tutor:${tutorId}`, 'class.attendance', 'class_session', session.id, { studentPresent: v.studentPresent })
      return repo.get('class_sessions', session.id)
    },

    acknowledgeSession(sessionId, parentId) {
      const session = ctx.require('class_sessions', sessionId, 'Class')
      const enrolment = repo.get('enrolments', session.enrolmentId)
      if (enrolment.parentId !== parentId) throw ctx.notFound('Class')
      if (session.status !== 'completed') throw ctx.conflict('CLASS_NOT_COMPLETED', 'You can confirm a class after the tutor records it')
      if (!session.parentAckAt) repo.update('class_sessions', session.id, { parentAckAt: ctx.iso(), updatedAt: ctx.iso() })
      return repo.get('class_sessions', session.id)
    },

    // ---- Billing (manual payments; no gateway yet) ------------------------------------
    createInvoice(body, actor) {
      const v = ctx.validate(body, specs.invoiceSpec)
      const e = ctx.require('enrolments', v.enrolmentId, 'Enrolment')
      const stamp = ctx.iso()
      const invoice = repo.insert('invoices', {
        id: ctx.newId(), number: repo.nextSequence('invoices', 'HT-INV-'), enrolmentId: e.id, parentId: e.parentId, studentId: e.studentId,
        periodLabel: v.periodLabel, amount: v.amount, amountPaid: 0, dueDate: v.dueDate, status: 'pending', createdAt: stamp, updatedAt: stamp,
      })
      ctx.audit(actor, 'invoice.create', 'invoice', invoice.id, { amount: v.amount })
      return invoice
    },

    recordPayment(invoiceId, body, actor) {
      const v = ctx.validate(body, specs.paymentSpec)
      return repo.transaction(() => {
        const inv = ctx.require('invoices', invoiceId, 'Invoice')
        if (!['pending', 'partial'].includes(inv.status)) throw ctx.conflict('INVOICE_CLOSED', `This invoice is ${inv.status}`)
        const outstanding = inv.amount - inv.amountPaid
        if (v.amount > outstanding) throw ctx.invalid([{ field: 'amount', message: `is more than the ₹${outstanding} outstanding` }])
        const payment = repo.insert('payments', {
          id: ctx.newId(), invoiceId: inv.id, amount: v.amount, method: v.method, reference: v.reference || null,
          paidOn: v.paidOn, notes: v.notes || null, recordedBy: actor, createdAt: ctx.iso(),
        })
        const paid = inv.amountPaid + v.amount
        repo.update('invoices', inv.id, { amountPaid: paid, status: paid >= inv.amount ? 'paid' : 'partial', updatedAt: ctx.iso() })
        ctx.audit(actor, 'payment.record', 'invoice', inv.id, { amount: v.amount, method: v.method })
        return { payment, invoice: repo.get('invoices', inv.id) }
      })
    },

    voidInvoice(invoiceId, actor) {
      const inv = ctx.require('invoices', invoiceId, 'Invoice')
      if (inv.amountPaid > 0 || inv.status !== 'pending') throw ctx.conflict('INVOICE_HAS_PAYMENTS', 'Only an unpaid invoice can be voided')
      repo.update('invoices', inv.id, { status: 'void', updatedAt: ctx.iso() })
      ctx.audit(actor, 'invoice.void', 'invoice', inv.id)
      return repo.get('invoices', inv.id)
    },

    invoiceView(inv) {
      return {
        ...inv,
        outstanding: inv.status === 'void' ? 0 : inv.amount - inv.amountPaid,
        overdue: ['pending', 'partial'].includes(inv.status) && inv.dueDate < ctx.today(),
        payments: repo.find('payments', { invoiceId: inv.id }, { orderBy: 'created_at ASC' }),
      }
    },

    // ---- Reviews -----------------------------------------------------------------------
    reviewTutor(parentId, leadId, body) {
      const v = ctx.validate(body, specs.reviewSpec)
      const lead = ctx.require('leads', leadId, 'Request')
      if (lead.parentId !== parentId) throw ctx.notFound('Request')
      const enrolment = repo.findOne('enrolments', { leadId })
      const demo = repo.find('demos', { leadId, status: 'completed' })[0]
      const stage = enrolment ? 'ongoing' : 'demo'
      const tutorId = enrolment ? enrolment.tutorId : demo?.tutorId
      if (!tutorId) throw ctx.conflict('NOTHING_TO_REVIEW', 'You can rate the tutor after the demo')
      if (repo.findOne('reviews', { parentId, leadId, stage })) throw ctx.conflict('ALREADY_REVIEWED', 'You have already rated this tutor at this stage')
      return repo.transaction(() => {
        const review = repo.insert('reviews', { id: ctx.newId(), parentId, tutorId, leadId, stage, rating: v.rating, comment: v.comment || null, createdAt: ctx.iso() })
        const tutor = repo.get('tutors', tutorId)
        const count = tutor.ratingCount + 1
        const avg = ((tutor.ratingAvg || 0) * tutor.ratingCount + v.rating) / count
        repo.update('tutors', tutorId, { ratingAvg: Math.round(avg * 100) / 100, ratingCount: count })
        ctx.audit(`parent:${parentId}`, 'review.create', 'tutor', tutorId, { rating: v.rating, stage })
        return review
      })
    },
  }
  return self
}

module.exports = { createDelivery, addDays }
