const specs = require('./parent.validation')
const { pageParams } = require('../../shared/utils/pagination')
const { mapSeries } = require('../../shared/utils/async')
const { parentRecord, studentRecord } = require('./parent.records')

// Staff view of parent accounts: list, create by hand (for example after a phone call), edit,
// and add students. Parents created here can sign in later with their phone number.
function createParentAdminService(ctx, { views, enquiries }) {
  const { repo } = ctx

  const self = {
    async listParents(query = {}) {
      const { limit, offset, page } = pageParams(query)
      let parents = await repo.find('Parent', {})
      const q = typeof query.q === 'string' ? query.q.trim().toLowerCase().slice(0, 80) : ''
      if (q) parents = parents.filter(p => [p.name, p.phone, p.email, p.pincode].some(v => v && v.toLowerCase().includes(q)))
      const items = await mapSeries(parents.slice(offset, offset + limit), async p => {
        const leads = await repo.find('Lead', { parentId: p.id })
        return {
          id: p.id, name: p.name, phone: p.phone, email: p.email, relationship: p.relationship, pincode: p.pincode, createdAt: p.createdAt,
          students: await repo.count('Student', { parentId: p.id }),
          openRequests: leads.filter(l => !['converted', 'lost', 'cancelled'].includes(l.status)).length,
          requests: leads.length,
          createdByStaff: Boolean(p.consent?.recordedBy),
        }
      })
      return { items, total: parents.length, page, limit }
    },

    async parentDetail(parentId) {
      const parent = await ctx.require('Parent', parentId, 'Parent')
      return {
        ...parent,
        students: await repo.find('Student', { parentId }, { sort: { createdAt: 1 } }),
        requests: await mapSeries(await repo.find('Lead', { parentId }), views.leadSummary),
        enquiries: await repo.find('Enquiry', { phone: parent.phone }),
      }
    },

    async createParent(body, actor) {
      const v = ctx.validate(body, specs.adminParentSpec)
      if (v.enquiryId) await enquiries.get(v.enquiryId)
      const existing = await repo.findOne('Parent', { phone: v.phone })
      if (existing) throw ctx.conflict('ALREADY_REGISTERED', `${existing.name} already uses this number. Open their record instead.`)
      const location = { address: v.address || null, pincode: v.pincode || null, latitude: null, longitude: null }
      const parent = await repo.insert('Parent', parentRecord(ctx, v, location, {
        recordedBy: actor, recordedAt: ctx.iso(), note: 'Created by staff; consent to be confirmed with the parent',
      }))
      await ctx.audit(actor, 'parent.create', 'parent', parent.id)
      if (v.enquiryId) await enquiries.link(v.enquiryId, { parentId: parent.id }, actor)
      return self.parentDetail(parent.id)
    },

    async updateParent(parentId, body, actor) {
      const v = ctx.validate(body, specs.adminParentUpdateSpec, { partial: true })
      await ctx.require('Parent', parentId, 'Parent')
      await repo.update('Parent', parentId, { ...v, updatedAt: ctx.iso() })
      await ctx.audit(actor, 'parent.update', 'parent', parentId, { fields: Object.keys(v) })
      return self.parentDetail(parentId)
    },

    async addStudent(parentId, body, actor) {
      const v = ctx.validate(body, specs.studentSpec)
      await ctx.require('Parent', parentId, 'Parent')
      const student = await repo.insert('Student', studentRecord(ctx, parentId, v))
      await ctx.audit(actor, 'student.create', 'student', student.id, { parentId })
      return self.parentDetail(parentId)
    },
  }
  return self
}

module.exports = { createParentAdminService }
