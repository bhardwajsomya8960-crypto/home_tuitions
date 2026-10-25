const specs = require('./parent.validation')
const { consentErrors } = require('../../shared/consent')
const { parentRecord, studentRecord } = require('./parent.records')

// Parent accounts and their students, and requests made from the website or the parent portal.
function createParentService(ctx, { leads, catalogue }) {
  const { repo } = ctx

  const self = {
    async registerParent(body, authService) {
      const v = ctx.validate(body, specs.parentRegistrationSpec)
      authService.verifyPhoneToken(v.phoneToken, v.phone, 'parent')
      const consentProblems = consentErrors(v.consent, { location: v.latitude !== undefined })
      if (consentProblems.length) throw ctx.invalid(consentProblems)
      if (await repo.findOne('Parent', { phone: v.phone })) {
        throw ctx.conflict('ALREADY_REGISTERED', 'An account with this mobile number already exists. Sign in to add a new request.')
      }
      const course = await catalogue.resolvePublicCourse({ courseId: v.courseId || null, courseSlug: v.courseSlug || null })
      const location = await leads.resolveLocation(v)

      return repo.transaction(async () => {
        const parent = await repo.insert('Parent', parentRecord(ctx, v, location, { ...v.consent, recordedAt: ctx.iso() }))
        const student = await repo.insert('Student', studentRecord(ctx, parent.id, { ...v, subjects: v.subjects }))
        const lead = await leads.createLead({ parent, student, req: v, location, source: v.source || 'website', course, actor: `parent:${parent.id}` })
        await ctx.audit(`parent:${parent.id}`, 'parent.register', 'parent', parent.id)
        return { parent, student, lead }
      })
    },

    getParent(parentId) {
      return ctx.require('Parent', parentId, 'Parent')
    },

    listStudents(parentId) {
      return repo.find('Student', { parentId }, { sort: { createdAt: 1 } })
    },

    async addStudent(parentId, body) {
      const v = ctx.validate(body, specs.studentSpec)
      const student = await repo.insert('Student', studentRecord(ctx, parentId, v))
      await ctx.audit(`parent:${parentId}`, 'student.create', 'student', student.id)
      return student
    },

    // A signed-in parent asking for tuition for an existing student or a new one.
    async createRequest(parentId, body) {
      const v = ctx.validate(body, specs.parentRequestSpec)
      const parent = await self.getParent(parentId)
      if (v.latitude !== undefined && v.locationConsent !== true) {
        throw ctx.invalid([{ field: 'locationConsent', message: 'Location consent is required when sharing your location' }])
      }
      let student
      if (v.studentId) {
        student = await repo.get('Student', v.studentId)
        if (!student || student.parentId !== parentId) throw ctx.notFound('Student')
      } else {
        const missing = ['studentName', 'studentClass', 'board'].filter(k => !v[k]).map(field => ({ field, message: 'is required for a new student' }))
        if (missing.length) throw ctx.invalid(missing)
      }
      const location = await leads.resolveLocation({ ...v, address: v.address || parent.address, pincode: v.pincode || parent.pincode })
      return repo.transaction(async () => {
        if (!student) student = await repo.insert('Student', studentRecord(ctx, parentId, v))
        return leads.createLead({ parent, student, req: v, location, source: 'website', actor: `parent:${parentId}`, note: 'New request from the parent portal' })
      })
    },
  }
  return self
}

module.exports = { createParentService }
