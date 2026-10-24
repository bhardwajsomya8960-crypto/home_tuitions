const { addDays } = require('./delivery')

// Read models for the parent and tutor portals. Every query is scoped to the signed-in
// parent or tutor; ownership is checked here, not in the browser.
function createPortals(ctx, { views, people, assignments, delivery }) {
  const { repo } = ctx

  function ownLead(parentId, leadId) {
    const lead = repo.get('leads', leadId)
    if (!lead || lead.parentId !== parentId) throw ctx.notFound('Request')
    return lead
  }

  function ownDemo(parentId, demoId) {
    const demo = repo.get('demos', demoId)
    if (!demo) throw ctx.notFound('Demo')
    ownLead(parentId, demo.leadId)
    return demo
  }

  const sessionView = s => {
    const student = repo.get('students', s.enrolment.studentId)
    const tutor = repo.get('tutors', s.enrolment.tutorId)
    const { enrolment, ...rest } = s
    return { ...rest, studentName: student?.name, tutorName: tutor?.name, subjects: enrolment.subjects, mode: enrolment.mode }
  }

  return {
    // ---- Parent ------------------------------------------------------------------------
    parentOverview(parentId) {
      assignments.expireOffers()
      const parent = people.getParent(parentId)
      const leads = repo.find('leads', { parentId }).map(views.parentLead)
      const enrolments = repo.find('enrolments', { parentId })
      const upcoming = delivery.sessionsFor(enrolments.filter(e => e.status === 'active'), { from: ctx.today(), to: addDays(ctx.today(), 14) })
      const invoices = repo.find('invoices', { parentId }).map(delivery.invoiceView)
      return {
        parent: { id: parent.id, name: parent.name, phone: parent.phone, email: parent.email, relationship: parent.relationship, address: parent.address, pincode: parent.pincode },
        students: people.listStudents(parentId),
        requests: leads,
        upcomingClasses: upcoming.filter(s => s.status === 'scheduled').map(sessionView),
        invoices,
        stats: {
          students: repo.count('students', { parentId }),
          activeEnrolments: enrolments.filter(e => e.status === 'active').length,
          openRequests: leads.filter(l => !['converted', 'lost', 'cancelled'].includes(l.status)).length,
          amountDue: invoices.reduce((sum, i) => sum + i.outstanding, 0),
        },
      }
    },

    parentClasses(parentId) {
      const enrolments = repo.find('enrolments', { parentId })
      return delivery.sessionsFor(enrolments).map(sessionView).reverse()
    },

    cancelRequest(parentId, leadId, reason) {
      const lead = ownLead(parentId, leadId)
      const view = views.parentLead(lead)
      if (!view.canCancel) throw ctx.conflict('CANNOT_CANCEL', 'This request can no longer be cancelled here. Contact support.')
      if (reason !== undefined && (typeof reason !== 'string' || reason.length > 500)) throw ctx.invalid([{ field: 'reason', message: 'must be text up to 500 characters' }])
      return repo.transaction(() => {
        for (const a of repo.find('assignments', { leadId, status: ['offered', 'accepted', 'confirmed'] })) {
          repo.update('assignments', a.id, { status: a.status === 'offered' ? 'withdrawn' : 'released', updatedAt: ctx.iso() })
        }
        for (const d of repo.find('demos', { leadId, status: 'scheduled' })) repo.update('demos', d.id, { status: 'cancelled', updatedAt: ctx.iso() })
        if (!ctx.moveLead(lead, 'cancelled', `parent:${parentId}`, { note: reason || 'Cancelled by the parent' })) {
          throw ctx.conflict('STALE', 'This request has just changed. Reload and try again.')
        }
        return views.parentLead(repo.get('leads', leadId))
      })
    },

    parentDemoOutcome(parentId, demoId, outcome) {
      ownDemo(parentId, demoId)
      delivery.setOutcome(demoId, outcome, `parent:${parentId}`)
      return views.parentLead(repo.get('leads', repo.get('demos', demoId).leadId))
    },

    parentRescheduleRequest(parentId, demoId, message) {
      const demo = ownDemo(parentId, demoId)
      if (demo.status !== 'scheduled') throw ctx.conflict('DEMO_CLOSED', 'Only a scheduled demo can be moved')
      if (typeof message !== 'string' || message.trim().length < 3 || message.length > 500) throw ctx.invalid([{ field: 'message', message: 'Tell us a suitable time (3 to 500 characters)' }])
      ctx.event(demo.leadId, 'reschedule_requested', `parent:${parentId}`, { note: message.trim() })
      return { ok: true }
    },

    // ---- Tutor -------------------------------------------------------------------------
    tutorOverview(tutorId) {
      assignments.expireOffers()
      const tutor = people.getTutor(tutorId)
      const all = repo.find('assignments', { tutorId })
      const enrolments = repo.find('enrolments', { tutorId })
      const sessions = delivery.sessionsFor(enrolments.filter(e => e.status === 'active'), { to: addDays(ctx.today(), 14) })
      const completed = repo.find('enrolments', { tutorId }).flatMap(e => repo.find('class_sessions', { enrolmentId: e.id, status: 'completed' }))
      return {
        tutor: { ...tutor, documents: people.listDocuments(tutorId), requiredDocuments: people.REQUIRED_DOCS },
        offers: all.filter(a => a.status === 'offered').map(views.tutorOffer),
        assignments: all.filter(a => ['accepted', 'confirmed'].includes(a.status)).map(views.tutorOffer),
        history: all.filter(a => !['offered', 'accepted', 'confirmed'].includes(a.status)).slice(0, 50).map(views.tutorOffer),
        demos: repo.find('demos', { tutorId }, { orderBy: 'scheduled_at DESC' }).map(d => {
          const lead = repo.get('leads', d.leadId)
          return { ...d, leadCode: lead.code, class: lead.class, subjects: lead.subjects }
        }),
        students: enrolments.map(e => {
          const student = repo.get('students', e.studentId)
          const parent = repo.get('parents', e.parentId)
          const done = repo.find('class_sessions', { enrolmentId: e.id, status: 'completed' })
          return {
            enrolmentId: e.id, status: e.status, studentName: student.name, class: student.class, board: student.board,
            subjects: e.subjects, mode: e.mode, schedule: e.schedule, startDate: e.startDate, parentName: parent.name, parentPhone: parent.phone,
            classesCompleted: done.length, attendanceRate: done.length ? Math.round((done.filter(s => s.studentPresent).length / done.length) * 100) : null,
          }
        }),
        classes: sessions.map(sessionView),
        stats: {
          openOffers: all.filter(a => a.status === 'offered').length,
          activeStudents: enrolments.filter(e => e.status === 'active').length,
          classesCompleted: completed.length,
          ratingAvg: tutor.ratingAvg,
          ratingCount: tutor.ratingCount,
        },
      }
    },
  }
}

module.exports = { createPortals }
