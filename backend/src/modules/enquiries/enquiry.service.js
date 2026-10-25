const M = require('../../shared/masters')
const specs = require('./enquiry.validation')
const { pageParams } = require('../../shared/utils/pagination')

const OPEN = ['new', 'contacted']
const REPEAT_WINDOW_DAYS = 7

// Website callback requests. Anyone can send one without an account; staff work through them
// in the admin console and turn them into parents, tuition requests or tutors.
function createEnquiryService(ctx) {
  const { repo } = ctx

  const self = {
    // From the public website form. A second request from the same number within a week is
    // added to the open one instead of creating a duplicate.
    async submit(body) {
      const v = ctx.validate(body, specs.publicEnquirySpec)
      // Bots fill in every field, including the hidden "website" one. Say thanks and keep nothing.
      if (v.website) return { received: true }
      delete v.website
      return self.record({ ...v, source: 'website' }, 'website')
    },

    // Staff noting a call or WhatsApp message as an enquiry.
    async createByStaff(body, actor) {
      const v = ctx.validate(body, specs.staffEnquirySpec)
      return self.record({ ...v, source: v.source || 'whatsapp' }, actor)
    },

    async record(v, actor) {
      const since = new Date(ctx.now().getTime() - REPEAT_WINDOW_DAYS * 24 * 3600 * 1000).toISOString()
      const open = (await repo.find('Enquiry', { phone: v.phone, kind: v.kind, status: OPEN })).find(e => e.createdAt >= since)
      if (open) {
        const extra = [v.message, v.level && `Level: ${M.ENQUIRY_LEVELS.find(l => l.value === v.level)?.label}`].filter(Boolean).join(' · ')
        await repo.update('Enquiry', open.id, {
          name: open.name || v.name || null,
          role: open.role || v.role || null,
          level: open.level || v.level || null,
          repeatCount: open.repeatCount + 1,
          notes: [...open.notes, { at: ctx.iso(), by: actor, text: `Sent the form again${extra ? `: ${extra}` : ''}` }],
          updatedAt: ctx.iso(),
        })
        return { received: true, id: open.id }
      }
      const stamp = ctx.iso()
      const enquiry = await repo.insert('Enquiry', {
        id: ctx.newId(), kind: v.kind, phone: v.phone, name: v.name || null, role: v.kind === 'parent' ? v.role || null : null,
        level: v.level || null, message: v.message || null, courseSlug: v.courseSlug || null, source: v.source,
        status: 'new', notes: [], createdAt: stamp, updatedAt: stamp,
      })
      await ctx.audit(actor, 'enquiry.create', 'enquiry', enquiry.id, { kind: v.kind, source: v.source })
      return { received: true, id: enquiry.id }
    },

    async list(query = {}) {
      const { limit, offset, page } = pageParams(query)
      const filters = {}
      if (['parent', 'tutor'].includes(query.kind)) filters.kind = query.kind
      if (M.ENQUIRY_STATUSES.includes(query.status)) filters.status = query.status
      else if (query.status === 'open') filters.status = OPEN
      let items = await repo.find('Enquiry', filters)
      const q = typeof query.q === 'string' ? query.q.trim().toLowerCase().slice(0, 80) : ''
      if (q) items = items.filter(e => [e.name, e.phone, e.message].some(v => v && v.toLowerCase().includes(q)))
      return { items: items.slice(offset, offset + limit), total: items.length, page, limit }
    },

    get(id) {
      return ctx.require('Enquiry', id, 'Enquiry')
    },

    countNew() {
      return repo.count('Enquiry', { status: 'new' })
    },

    // Status changes and call notes. "converted" is set only by linking (see link()).
    async update(id, body, actor) {
      const v = ctx.validate(body, specs.enquiryUpdateSpec, { partial: true })
      const enquiry = await self.get(id)
      if (enquiry.status === 'converted' && v.status) throw ctx.conflict('ENQUIRY_CONVERTED', 'This enquiry has already been turned into a record')
      if (v.status === 'closed' && !v.closedReason && !v.note) throw ctx.invalid([{ field: 'closedReason', message: 'Say why it is closed' }])
      const fields = { updatedAt: ctx.iso() }
      const notes = [...enquiry.notes]
      if (v.note && v.note.trim()) notes.push({ at: ctx.iso(), by: actor, text: v.note.trim() })
      if (v.status) {
        fields.status = v.status
        if (v.status === 'contacted' && !enquiry.contactedAt) fields.contactedAt = ctx.iso()
        if (v.status === 'closed') fields.closedReason = (v.closedReason || v.note || '').trim()
        if (v.status !== 'closed') fields.closedReason = null
        notes.push({ at: ctx.iso(), by: actor, text: `Marked ${v.status}${v.status === 'closed' && v.closedReason ? `: ${v.closedReason}` : ''}` })
      }
      fields.notes = notes
      await repo.update('Enquiry', id, fields)
      if (v.status) await ctx.audit(actor, 'enquiry.status', 'enquiry', id, { from: enquiry.status, to: v.status })
      return self.get(id)
    },

    // Records what the enquiry became (a parent, a tuition request, a tutor) and closes it.
    async link(id, { parentId, leadId, tutorId }, actor) {
      const enquiry = await self.get(id)
      const fields = { status: 'converted', updatedAt: ctx.iso() }
      if (parentId) fields.parentId = parentId
      if (leadId) fields.leadId = leadId
      if (tutorId) fields.tutorId = tutorId
      if (!enquiry.contactedAt) fields.contactedAt = ctx.iso()
      const what = [leadId && 'tuition request', parentId && !leadId && 'parent', tutorId && 'tutor'].filter(Boolean).join(', ')
      fields.notes = [...enquiry.notes, { at: ctx.iso(), by: actor, text: `Created ${what}` }]
      await repo.update('Enquiry', id, fields)
      await ctx.audit(actor, 'enquiry.convert', 'enquiry', id, { parentId, leadId, tutorId })
    },
  }
  return self
}

module.exports = { createEnquiryService }
