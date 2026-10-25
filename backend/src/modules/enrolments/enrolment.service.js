const specs = require('./enrolment.validation')
const { addDays, monthLabel } = require('../../shared/utils/dates')
const { pageParams } = require('../../shared/utils/pagination')
const { mapSeries } = require('../../shared/utils/async')

const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
const SESSION_HORIZON_DAYS = 14
const isDuplicateKey = err => err && err.code === 11000

// Enrolments and their classes (blueprint §12.5–12.6): conversion after a demo, pausing and
// ending tuition, the class calendar, attendance and parent confirmation.
function createEnrolmentService(ctx, { assignments, billing }) {
  const { repo } = ctx

  const self = {
    // Business rule 6: acceptance is not conversion. A lead converts only after a demo.
    async convertLead(leadId, body, actor) {
      const v = ctx.validate(body, specs.conversionSpec)
      const lead = await ctx.require('Lead', leadId, 'Lead')
      if (lead.status !== 'demo_completed') throw ctx.conflict('LEAD_NOT_READY', 'A lead can be converted after its demo is completed')
      const assignment = await assignments.activeAssignment(leadId)
      if (!assignment || assignment.status !== 'confirmed') throw ctx.conflict('NO_TUTOR', 'No confirmed tutor for this lead')

      return repo.transaction(async () => {
        const stamp = ctx.iso()
        const enrolment = await repo.insert('Enrolment', {
          id: ctx.newId(), leadId, studentId: lead.studentId, parentId: lead.parentId, tutorId: assignment.tutorId,
          subjects: v.subjects || lead.subjects, mode: lead.mode, plan: v.plan, feeAmount: v.feeAmount,
          startDate: v.startDate, schedule: v.schedule, status: 'active', createdAt: stamp, updatedAt: stamp,
        })
        if (!(await ctx.moveLead(lead, 'converted', actor, { type: 'converted', note: `Enrolment created (${v.plan}, ₹${v.feeAmount})` }))) {
          throw ctx.conflict('STALE', 'The lead changed while you were converting it. Reload and try again.')
        }
        const periodLabel = { monthly: `Fees for ${monthLabel(v.startDate)}`, quarterly: `Quarter from ${monthLabel(v.startDate)}`, one_time: 'Course fee', custom: 'First payment' }[v.plan]
        await billing.createInvoice({ enrolmentId: enrolment.id, amount: v.feeAmount, periodLabel, dueDate: addDays(v.startDate, 7) }, actor)
        await self.ensureSessions(enrolment)
        await ctx.audit(actor, 'enrolment.create', 'enrolment', enrolment.id, { leadId })
        return enrolment
      })
    },

    async setEnrolmentStatus(enrolmentId, status, actor) {
      const allowed = { active: ['paused', 'completed', 'cancelled'], paused: ['active', 'cancelled'] }
      const e = await ctx.require('Enrolment', enrolmentId, 'Enrolment')
      if (!(allowed[e.status] || []).includes(status)) throw ctx.conflict('INVALID_TRANSITION', `An enrolment that is ${e.status} cannot become ${status}`)
      await repo.update('Enrolment', e.id, { status, updatedAt: ctx.iso() })
      if (status !== 'active') {
        for (const s of await repo.find('ClassSession', { enrolmentId: e.id, status: 'scheduled' })) {
          if (s.scheduledDate >= ctx.today()) await repo.update('ClassSession', s.id, { status: 'cancelled', updatedAt: ctx.iso() })
        }
      }
      await ctx.audit(actor, 'enrolment.status', 'enrolment', e.id, { from: e.status, to: status })
      return repo.get('Enrolment', e.id)
    },

    // Creates scheduled sessions for an active enrolment up to two weeks ahead. Safe to call
    // repeatedly (and at the same time): a unique index stops duplicate classes.
    async ensureSessions(enrolment) {
      if (enrolment.status !== 'active') return
      const today = ctx.today()
      const from = enrolment.startDate > today ? enrolment.startDate : today
      const until = addDays(today > enrolment.startDate ? today : enrolment.startDate, SESSION_HORIZON_DAYS)
      const existing = new Set((await repo.find('ClassSession', { enrolmentId: enrolment.id })).map(s => `${s.scheduledDate}:${s.slot}`))
      for (let date = from; date <= until; date = addDays(date, 1)) {
        const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
        for (const entry of enrolment.schedule) {
          if (DAY_INDEX[entry.day] !== weekday || existing.has(`${date}:${entry.slot}`)) continue
          const stamp = ctx.iso()
          try {
            await repo.insert('ClassSession', { id: ctx.newId(), enrolmentId: enrolment.id, scheduledDate: date, slot: entry.slot, status: 'scheduled', createdAt: stamp, updatedAt: stamp })
          } catch (err) {
            if (!isDuplicateKey(err)) throw err
          }
        }
      }
    },

    async sessionsFor(enrolments, { from, to } = {}) {
      const out = []
      for (const e of enrolments) {
        await self.ensureSessions(e)
        for (const s of await repo.find('ClassSession', { enrolmentId: e.id }, { sort: { scheduledDate: 1, slot: 1 } })) {
          if (from && s.scheduledDate < from) continue
          if (to && s.scheduledDate > to) continue
          out.push({ ...s, enrolment: e })
        }
      }
      return out.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    },

    // A class with the student and tutor names, for the portals.
    async sessionView(s) {
      const student = await repo.get('Student', s.enrolment.studentId)
      const tutor = await repo.get('Tutor', s.enrolment.tutorId)
      const { enrolment, ...rest } = s
      return { ...rest, studentName: student?.name, tutorName: tutor?.name, subjects: enrolment.subjects, mode: enrolment.mode }
    },

    async recordAttendance(sessionId, tutorId, body) {
      const v = ctx.validate(body, specs.attendanceSpec)
      const session = await ctx.require('ClassSession', sessionId, 'Class')
      const enrolment = await repo.get('Enrolment', session.enrolmentId)
      if (enrolment.tutorId !== tutorId) throw ctx.notFound('Class')
      if (session.status === 'cancelled') throw ctx.conflict('CLASS_CANCELLED', 'This class was cancelled')
      if (session.scheduledDate > ctx.today()) throw ctx.conflict('CLASS_IN_FUTURE', 'Attendance can be recorded on or after the class date')
      await repo.update('ClassSession', session.id, {
        status: 'completed', tutorPresent: v.tutorPresent, studentPresent: v.studentPresent,
        notes: v.notes || null, homework: v.homework || null, updatedAt: ctx.iso(),
      })
      await ctx.audit(`tutor:${tutorId}`, 'class.attendance', 'class_session', session.id, { studentPresent: v.studentPresent })
      return repo.get('ClassSession', session.id)
    },

    async acknowledgeSession(sessionId, parentId) {
      const session = await ctx.require('ClassSession', sessionId, 'Class')
      const enrolment = await repo.get('Enrolment', session.enrolmentId)
      if (enrolment.parentId !== parentId) throw ctx.notFound('Class')
      if (session.status !== 'completed') throw ctx.conflict('CLASS_NOT_COMPLETED', 'You can confirm a class after the tutor records it')
      if (!session.parentAckAt) await repo.update('ClassSession', session.id, { parentAckAt: ctx.iso(), updatedAt: ctx.iso() })
      return repo.get('ClassSession', session.id)
    },

    async listEnrolments(query) {
      const { limit, offset, page } = pageParams(query)
      const filters = ['active', 'paused', 'completed', 'cancelled'].includes(query.status) ? { status: query.status } : {}
      const items = await mapSeries(await repo.find('Enrolment', filters), async e => ({
        ...e,
        studentName: (await repo.get('Student', e.studentId))?.name,
        parentName: (await repo.get('Parent', e.parentId))?.name,
        tutorName: (await repo.get('Tutor', e.tutorId))?.name,
        leadCode: (await repo.get('Lead', e.leadId))?.code,
      }))
      return { items: items.slice(offset, offset + limit), total: items.length, page, limit }
    },
  }
  return self
}

module.exports = { createEnrolmentService }
