const specs = require('./tutor.validation')
const { consentErrors } = require('../../shared/consent')

// Tutor accounts: registration and the profile a tutor edits (teaching details, weekly hours,
// time off, lead preferences).
function createTutorService(ctx, { geo }) {
  const { repo } = ctx

  return {
    async registerTutor(body, authService) {
      const v = ctx.validate(body, specs.tutorRegistrationSpec)
      authService.verifyPhoneToken(v.phoneToken, v.phone, 'tutor')
      const consentProblems = consentErrors(v.consent, { location: v.latitude !== undefined })
      if (consentProblems.length) throw ctx.invalid(consentProblems)
      if (v.feeMin !== undefined && v.feeMax !== undefined && v.feeMin > v.feeMax) {
        throw ctx.invalid([{ field: 'feeMax', message: 'must be at least the minimum fee' }])
      }
      if (await repo.findOne('Tutor', { phone: v.phone })) {
        throw ctx.conflict('ALREADY_REGISTERED', 'A tutor account with this mobile number already exists. Sign in instead.')
      }
      let { latitude, longitude } = v
      if (latitude === undefined) {
        const geocoded = await geo.geocodeAddress(v.address, v.pincode)
        if (geocoded) ({ latitude, longitude } = geocoded)
      }
      const stamp = ctx.iso()
      const { phoneToken, consent, ...fields } = v
      const tutor = await repo.insert('Tutor', {
        ...fields,
        id: ctx.newId(),
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        serviceRadiusKm: v.serviceRadiusKm ?? (await ctx.settings()).defaultHomeRadiusKm,
        feeMin: v.feeMin ?? null,
        feeMax: v.feeMax ?? null,
        acceptingLeads: true,
        status: 'pending',
        ratingCount: 0,
        consent: { ...consent, recordedAt: stamp },
        createdAt: stamp,
        updatedAt: stamp,
      })
      await ctx.audit(`tutor:${tutor.id}`, 'tutor.register', 'tutor', tutor.id)
      return tutor
    },

    getTutor(tutorId) {
      return ctx.require('Tutor', tutorId, 'Tutor')
    },

    async updateTutor(tutorId, body) {
      const v = ctx.validate(body, specs.tutorUpdateSpec, { partial: true })
      const tutor = await ctx.require('Tutor', tutorId, 'Tutor')
      const feeMin = v.feeMin ?? tutor.feeMin
      const feeMax = v.feeMax ?? tutor.feeMax
      if (feeMin != null && feeMax != null && feeMin > feeMax) throw ctx.invalid([{ field: 'feeMax', message: 'must be at least the minimum fee' }])
      if (v.timeOff) {
        v.timeOff = v.timeOff
          .map(t => ({ from: t.from, to: t.to, ...(t.reason?.trim() ? { reason: t.reason.trim() } : {}) }))
          .sort((a, b) => a.from.localeCompare(b.from))
      }
      await repo.update('Tutor', tutorId, { ...v, updatedAt: ctx.iso() })
      await ctx.audit(`tutor:${tutorId}`, 'tutor.update', 'tutor', tutorId, { fields: Object.keys(v) })
      return ctx.require('Tutor', tutorId, 'Tutor')
    },
  }
}

module.exports = { createTutorService }
