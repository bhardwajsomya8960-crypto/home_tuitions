const M = require('../../shared/masters')
const { pageParams } = require('../../shared/utils/pagination')
const { mapSeries } = require('../../shared/utils/async')
const { needsLocation } = require('../matching/matching.engine')
const { parentRecord, studentRecord } = require('../parents/parent.records')
const specs = require('./lead.validation')

// Leads (blueprint §12.1): creating them from any channel, and the staff CRM actions.
function createLeadService(ctx, { views, geo }) {
  const { repo } = ctx

  // Leads from the same parent for the same student and subject within 30 days are flagged.
  async function duplicateOf(parentId, studentId, subjects) {
    const since = new Date(ctx.now().getTime() - 30 * 24 * 3600 * 1000).toISOString()
    return (await repo.find('Lead', { parentId, studentId })).find(l =>
      l.createdAt >= since && !['lost', 'cancelled'].includes(l.status) && l.subjects.some(s => subjects.includes(s)))
  }

  async function leadRecord({ parentId, studentId, req, location, source, course }) {
    const stamp = ctx.iso()
    return {
      id: ctx.newId(),
      code: await repo.nextSequence('leads', 'HT-L-'),
      parentId,
      studentId,
      source,
      mode: req.mode,
      subjects: req.subjects,
      class: req.studentClass,
      board: req.board,
      preferredDays: req.preferredDays,
      preferredSlots: req.preferredSlots,
      prefGender: req.prefGender && req.prefGender !== 'No preference' ? req.prefGender : null,
      prefLanguages: req.prefLanguages || [],
      budgetRange: req.budgetRange || null,
      startDate: req.startDate || null,
      urgency: req.urgency || null,
      specialRequirements: req.specialRequirements || null,
      ...location,
      status: 'new',
      noTutorFound: false,
      courseId: course ? course.id : null,
      courseSlug: course ? course.slug : null,
      createdAt: stamp,
      updatedAt: stamp,
    }
  }

  const self = {
    // Address rules for a requirement. Coordinates come from the device (with consent) or geocoding.
    async resolveLocation(req) {
      if (!needsLocation(req.mode)) return { address: req.address || null, pincode: req.pincode || null, latitude: null, longitude: null, geocodeSource: null }
      const errors = []
      if (!req.address) errors.push({ field: 'address', message: 'is required for home tuition' })
      if (!req.pincode) errors.push({ field: 'pincode', message: 'is required for home tuition' })
      if ((req.latitude === undefined) !== (req.longitude === undefined)) errors.push({ field: 'latitude', message: 'latitude and longitude must be sent together' })
      if (errors.length) throw ctx.invalid(errors)
      if (req.latitude !== undefined) return { address: req.address, pincode: req.pincode, latitude: req.latitude, longitude: req.longitude, geocodeSource: 'device' }
      const geocoded = await geo.geocodeAddress(req.address, req.pincode)
      if (geocoded) return { address: req.address, pincode: req.pincode, latitude: geocoded.latitude, longitude: geocoded.longitude, geocodeSource: 'address' }
      return { address: req.address, pincode: req.pincode, latitude: null, longitude: null, geocodeSource: 'pincode' }
    },

    async createLead({ parent, student, req, location, source, course, actor, note }) {
      const dup = await duplicateOf(parent.id, student.id, req.subjects)
      const lead = await repo.insert('Lead', await leadRecord({ parentId: parent.id, studentId: student.id, req: { ...req, studentClass: student.class, board: student.board }, location, source, course }))
      await ctx.event(lead.id, 'created', actor, { to: 'new', note: note || `Enquiry received via ${source}` })
      if (dup) await ctx.event(lead.id, 'duplicate_suspected', 'system', { note: `Possible duplicate of ${dup.code}` })
      await ctx.audit(actor, 'lead.create', 'lead', lead.id, { source })
      return lead
    },

    // Staff-entered lead (BDA). Reuses the parent account when the number is known.
    async createStaffLead(body, actor) {
      const v = ctx.validate(body, specs.staffLeadSpec)
      const location = await self.resolveLocation(v)
      return repo.transaction(async () => {
        let parent = await repo.findOne('Parent', { phone: v.phone })
        if (!parent) {
          parent = await repo.insert('Parent', parentRecord(ctx, v, location, { recordedBy: actor, recordedAt: ctx.iso(), note: 'Created by staff; consent to be confirmed with the parent' }))
        }
        const student = (await repo.find('Student', { parentId: parent.id })).find(s => s.name.toLowerCase() === v.studentName.toLowerCase())
          || await repo.insert('Student', studentRecord(ctx, parent.id, v))
        return self.createLead({ parent, student, req: v, location, source: v.source, actor, note: v.note })
      })
    },

    // ---- Staff CRM -----------------------------------------------------------------------
    async listLeads(query) {
      const { limit, offset, page } = pageParams(query)
      const filters = {}
      if (M.LEAD_STATUSES.includes(query.status)) filters.status = query.status
      if (M.LEAD_SOURCES.includes(query.source)) filters.source = query.source
      if (M.LEAD_MODES.includes(query.mode)) filters.mode = query.mode
      if (query.noTutor === 'true') filters.noTutorFound = true
      let items = await mapSeries(await repo.find('Lead', filters), views.leadSummary)
      const q = typeof query.q === 'string' ? query.q.trim().toLowerCase().slice(0, 80) : ''
      if (q) items = items.filter(l => [l.code, l.parentName, l.parentPhone, l.studentName, l.pincode, ...l.subjects].some(v => v && String(v).toLowerCase().includes(q)))
      return { items: items.slice(offset, offset + limit), total: items.length, page, limit }
    },

    async leadDetail(leadId) {
      return views.adminLead(await ctx.require('Lead', leadId, 'Lead'))
    },

    async changeLeadStatus(leadId, { status, reason, note } = {}, actor) {
      const lead = await ctx.require('Lead', leadId, 'Lead')
      if (!(M.MANUAL_LEAD_TRANSITIONS[lead.status] || []).includes(status)) {
        throw ctx.conflict('INVALID_TRANSITION', `A lead in "${lead.status}" cannot be moved to "${status}" by hand`)
      }
      if (status === 'lost' && !M.values(M.LOST_REASONS).includes(reason)) throw ctx.invalid([{ field: 'reason', message: 'Choose why the lead was lost' }])
      if (note !== undefined && (typeof note !== 'string' || note.length > 1000)) throw ctx.invalid([{ field: 'note', message: 'must be text up to 1000 characters' }])
      await repo.transaction(async () => {
        // Closing a lead withdraws its open offers so tutors are not left waiting.
        if (['lost', 'cancelled', 'on_hold'].includes(status)) {
          for (const a of await repo.find('Assignment', { leadId, status: 'offered' })) await repo.update('Assignment', a.id, { status: 'withdrawn', updatedAt: ctx.iso() })
        }
        const moved = await ctx.moveLead(lead, status, actor, { note: [reason && M.LOST_REASONS.find(r => r.value === reason)?.label, note].filter(Boolean).join(' — ') || null })
        if (!moved) throw ctx.conflict('STALE', 'The lead changed while you were editing. Reload and try again.')
        if (status === 'lost') await repo.update('Lead', leadId, { lostReason: reason })
      })
      return self.leadDetail(leadId)
    },

    async addLeadNote(leadId, note, actor) {
      await ctx.require('Lead', leadId, 'Lead')
      if (typeof note !== 'string' || note.trim().length === 0 || note.length > 1000) throw ctx.invalid([{ field: 'note', message: 'must be 1 to 1000 characters' }])
      await ctx.event(leadId, 'note', actor, { note: note.trim() })
      return self.leadDetail(leadId)
    },

    async updateLeadLocation(leadId, body, actor) {
      const v = ctx.validate(body, specs.locationSpec, { partial: true })
      if ((v.latitude === undefined) !== (v.longitude === undefined)) throw ctx.invalid([{ field: 'latitude', message: 'latitude and longitude must be sent together' }])
      await ctx.require('Lead', leadId, 'Lead')
      await repo.update('Lead', leadId, { ...v, ...(v.latitude !== undefined ? { geocodeSource: 'staff' } : {}), updatedAt: ctx.iso() })
      await ctx.event(leadId, 'location_updated', actor)
      await ctx.audit(actor, 'lead.location', 'lead', leadId)
      return self.leadDetail(leadId)
    },
  }
  return self
}

module.exports = { createLeadService }
