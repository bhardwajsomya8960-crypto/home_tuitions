const geoService = require('../../services/geo.service')
const { isFreeFor, toRanges } = require('./availability')

// Admin-editable matching settings (blueprint §13, Appendix C). Weights are whole percentages
// and must add up to 100. Stored in the settings table; these are the defaults.
const DEFAULT_SETTINGS = {
  weights: {
    distance: 30,
    subjectFit: 25,
    availability: 15,
    experience: 10,
    quality: 10,
    acceptanceReliability: 5,
    feeFit: 5,
  },
  // Score for each distance band, by upper bound in km. Beyond the last band a home lead is excluded.
  distanceBands: [
    { maxKm: 3, score: 100 },
    { maxKm: 5, score: 85 },
    { maxKm: 8, score: 70 },
    { maxKm: 12, score: 50 },
  ],
  defaultHomeRadiusKm: 8,
  maxExtendedRadiusKm: 12,
  offerTimeoutMinutes: 10,
  maxSimultaneousOffers: 1,
  autoConfirmAssignments: false,
  demoDurationMinutes: 45,
  noShowEscalationThreshold: 2,
}

const WEIGHT_KEYS = Object.keys(DEFAULT_SETTINGS.weights)

// Returns a list of problems; empty means the settings are usable.
function validateSettings(s) {
  const problems = []
  const w = s.weights || {}
  for (const key of WEIGHT_KEYS) {
    if (!Number.isInteger(w[key]) || w[key] < 0 || w[key] > 100) problems.push(`weights.${key} must be a whole number from 0 to 100`)
  }
  for (const key of Object.keys(w)) if (!WEIGHT_KEYS.includes(key)) problems.push(`weights.${key} is not a known weight`)
  const total = WEIGHT_KEYS.reduce((sum, k) => sum + (Number.isInteger(w[k]) ? w[k] : 0), 0)
  if (total !== 100) problems.push(`weights must add up to 100 (currently ${total})`)

  const bands = s.distanceBands
  if (!Array.isArray(bands) || bands.length === 0 || bands.length > 8) {
    problems.push('distanceBands must list 1 to 8 bands')
  } else {
    let prev = 0
    for (const band of bands) {
      if (typeof band?.maxKm !== 'number' || band.maxKm <= prev || band.maxKm > 100) problems.push('distanceBands must have increasing maxKm values up to 100')
      if (!Number.isInteger(band?.score) || band.score < 0 || band.score > 100) problems.push('distanceBands scores must be whole numbers from 0 to 100')
      prev = band?.maxKm || prev
    }
  }

  const ints = {
    offerTimeoutMinutes: [1, 1440], maxSimultaneousOffers: [1, 10], demoDurationMinutes: [15, 180], noShowEscalationThreshold: [1, 10],
  }
  for (const [key, [min, max]] of Object.entries(ints)) {
    if (!Number.isInteger(s[key]) || s[key] < min || s[key] > max) problems.push(`${key} must be a whole number from ${min} to ${max}`)
  }
  for (const key of ['defaultHomeRadiusKm', 'maxExtendedRadiusKm']) {
    if (typeof s[key] !== 'number' || s[key] <= 0 || s[key] > 100) problems.push(`${key} must be a number above 0 and up to 100`)
  }
  if (s.defaultHomeRadiusKm > s.maxExtendedRadiusKm) problems.push('defaultHomeRadiusKm cannot exceed maxExtendedRadiusKm')
  if (typeof s.autoConfirmAssignments !== 'boolean') problems.push('autoConfirmAssignments must be true or false')
  return problems
}

const needsLocation = mode => mode === 'home' || mode === 'hybrid'
const hasCoords = r => typeof r.latitude === 'number' && typeof r.longitude === 'number'

function bandScore(distanceKm, bands) {
  const band = bands.find(b => distanceKm <= b.maxKm)
  return band ? band.score : 0
}

// Hard filters (blueprint §13.2). Returns a reason string when the tutor is ineligible.
function exclusionReason(lead, tutor, settings, distanceKm) {
  if (tutor.status !== 'active') return 'not active'
  if (!tutor.acceptingLeads) return 'paused new leads'
  if (tutor.onLeaveUntil) return `on leave until ${tutor.onLeaveUntil}`
  if (!tutor.classes.includes(String(lead.class))) return 'does not teach this class'
  if (!lead.subjects.some(s => tutor.subjects.includes(s))) return 'does not teach the requested subjects'
  if (lead.mode === 'home' && !tutor.modes.includes('home')) return 'does not offer home tuition'
  if (lead.mode === 'online' && !tutor.modes.includes('online')) return 'does not offer online tuition'
  if (lead.prefGender && ['Female', 'Male'].includes(lead.prefGender) && tutor.gender !== lead.prefGender) return 'gender preference'
  const overlap = slotOverlap(lead, tutor)
  if (overlap.matched === 0) return 'not available at the requested times'
  // Home leads, and hybrid leads with a home-only tutor, must be within the tutor's radius.
  if (lead.mode === 'home' || (lead.mode === 'hybrid' && !tutor.modes.includes('online'))) {
    if (distanceKm === null) return 'location unknown'
    if (distanceKm > serviceRadius(tutor, settings)) return 'outside service radius'
  }
  return null
}

function serviceRadius(tutor, settings) {
  return Math.min(tutor.serviceRadiusKm || settings.defaultHomeRadiusKm, settings.maxExtendedRadiusKm)
}

// For a hybrid lead, home lessons are possible only when the tutor travels and is close enough.
function canTeachAtHome(lead, tutor, settings, km) {
  return needsLocation(lead.mode) && tutor.modes.includes('home') && km !== null && km <= serviceRadius(tutor, settings)
}

// Requested (day, slot) pairs the tutor is free for. A request of days × slots is treated as
// every combination of the two; see availability.js for when hours count as free for a slot.
function slotOverlap(lead, tutor) {
  const ranges = toRanges(tutor.availability)
  let matched = 0
  let wanted = 0
  for (const day of lead.preferredDays) {
    for (const slot of lead.preferredSlots) {
      wanted++
      if (isFreeFor(ranges, day, slot)) matched++
    }
  }
  return { matched, wanted }
}

// Distance in km, or null when it cannot be worked out. Falls back to "same pincode" when
// coordinates are missing (blueprint §13.1), using the first band's upper bound as an estimate.
function distanceBetween(lead, tutor, settings) {
  if (hasCoords(lead) && hasCoords(tutor)) {
    return { km: geoService.calculateDistance(lead.latitude, lead.longitude, tutor.latitude, tutor.longitude), estimated: false }
  }
  if (lead.pincode && tutor.pincode && lead.pincode === tutor.pincode) {
    return { km: settings.distanceBands[0].maxKm, estimated: true }
  }
  return { km: null, estimated: false }
}

function feeFitScore(budget, tutor) {
  if (!budget || (tutor.feeMin == null && tutor.feeMax == null)) return 70 // unknown on either side: neutral
  const lo = tutor.feeMin ?? tutor.feeMax
  const hi = tutor.feeMax ?? tutor.feeMin
  if (hi <= budget.max && lo >= budget.min) return 100
  if (lo <= budget.max && hi >= budget.min) return 80 // ranges overlap
  const gap = lo > budget.max ? (lo - budget.max) / budget.max : (budget.min - hi) / Math.max(budget.min, 1)
  return gap <= 0.25 ? 50 : 20
}

// Scores one tutor for one lead. `stats` = { accepted, declined } offer history for reliability.
function scoreTutor(lead, tutor, settings, { budget, stats } = {}) {
  const { km, estimated } = distanceBetween(lead, tutor, settings)
  const excluded = exclusionReason(lead, tutor, settings, km)
  if (excluded) return { tutorId: tutor.id, eligible: false, reason: excluded }

  const onlineOnly = !canTeachAtHome(lead, tutor, settings, km)
  const distance = onlineOnly ? 100 : bandScore(km, settings.distanceBands)

  const covered = lead.subjects.filter(s => tutor.subjects.includes(s)).length / lead.subjects.length
  const boardFit = tutor.boards.includes(lead.board) ? 1 : 0
  const subjectFit = Math.round(60 * covered + 20 + 20 * boardFit) // class already required by the hard filter

  const overlap = slotOverlap(lead, tutor)
  const availability = Math.round((overlap.matched / overlap.wanted) * 100)

  const experience = Math.min(100, (tutor.experienceYears || 0) * 10)
  const quality = tutor.ratingCount > 0 ? Math.round((tutor.ratingAvg / 5) * 100) : 60
  const decided = stats ? stats.accepted + stats.declined : 0
  const acceptanceReliability = decided > 0 ? Math.round((stats.accepted / decided) * 100) : 80
  const feeFit = feeFitScore(budget, tutor)

  const factors = { distance, subjectFit, availability, experience, quality, acceptanceReliability, feeFit }
  const w = settings.weights
  const score = Math.round(WEIGHT_KEYS.reduce((sum, k) => sum + factors[k] * (w[k] / 100), 0))

  const reasons = []
  if (onlineOnly) reasons.push('Online lesson: distance not applied')
  else reasons.push(estimated ? 'Same pincode (distance estimated)' : `${km.toFixed(1)} km away`)
  reasons.push(`Teaches ${Math.round(covered * 100)}% of requested subjects${boardFit ? ` and the ${lead.board} board` : ''}`)
  reasons.push(`Free for ${overlap.matched} of ${overlap.wanted} requested time slots`)
  reasons.push(`${tutor.experienceYears || 0} years' experience`)
  if (tutor.ratingCount > 0) reasons.push(`Rated ${tutor.ratingAvg.toFixed(1)}/5 by ${tutor.ratingCount} parent(s)`)

  return {
    tutorId: tutor.id,
    eligible: true,
    score,
    distanceKm: km === null ? null : Math.round(km * 10) / 10,
    distanceEstimated: estimated,
    factors,
    reasons,
  }
}

// Ranks tutors for a lead: hard filters first, then score (highest first), ties by distance.
function rankTutors(lead, tutors, settings, context = {}) {
  const results = tutors.map(t => scoreTutor(lead, t, settings, {
    budget: context.budget,
    stats: context.statsByTutor ? context.statsByTutor[t.id] : undefined,
  }))
  const eligible = results.filter(r => r.eligible).sort((a, b) => b.score - a.score || (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
  const excluded = results.filter(r => !r.eligible)
  return { eligible, excluded }
}

module.exports = { DEFAULT_SETTINGS, WEIGHT_KEYS, validateSettings, scoreTutor, rankTutors, needsLocation }
