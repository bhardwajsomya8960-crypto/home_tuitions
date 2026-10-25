const { test, describe } = require('node:test')
const assert = require('node:assert/strict')
const { scoreTutor, rankTutors, validateSettings, DEFAULT_SETTINGS } = require('../src/services/matchingService')
const { PLACES } = require('./helpers')

const S = DEFAULT_SETTINGS

const lead = (over = {}) => ({
  mode: 'home', class: '8', board: 'CBSE', subjects: ['Mathematics'], preferredDays: ['tue', 'thu'], preferredSlots: ['evening'],
  prefGender: null, ...PLACES.ameerpet, ...over,
})

let n = 0
const tutor = (over = {}) => ({
  id: `t${n++}`, status: 'active', acceptingLeads: true, gender: 'Female', classes: ['7', '8', '9'], subjects: ['Mathematics'],
  boards: ['CBSE'], modes: ['home', 'online'], serviceRadiusKm: 8, experienceYears: 5, ratingAvg: null, ratingCount: 0,
  availability: [{ day: 'tue', slot: 'evening' }, { day: 'thu', slot: 'evening' }], feeMin: null, feeMax: null,
  ...PLACES.begumpet, ...over,
})

describe('hard filters', () => {
  const cases = [
    ['inactive tutors', { status: 'verified' }, 'not active'],
    ['tutors who paused new leads', { acceptingLeads: false }, 'paused new leads'],
    ['tutors on leave', { onLeaveUntil: '2026-11-05' }, 'on leave until 2026-11-05'],
    ['a different class', { classes: ['10'] }, 'does not teach this class'],
    ['no requested subject', { subjects: ['English'] }, 'does not teach the requested subjects'],
    ['online-only tutors for home leads', { modes: ['online'] }, 'does not offer home tuition'],
    ['no overlapping time slot', { availability: [{ day: 'mon', slot: 'morning' }] }, 'not available at the requested times'],
    ['outside the tutor radius', { ...PLACES.gachibowli, serviceRadiusKm: 8 }, 'outside service radius'],
    ['beyond the maximum radius even if the tutor allows more', { ...PLACES.gachibowli, serviceRadiusKm: 30, latitude: 17.2, longitude: 78.2 }, 'outside service radius'],
  ]
  for (const [name, over, reason] of cases) {
    test(`excludes ${name}`, () => {
      const r = scoreTutor(lead(), tutor(over), S)
      assert.equal(r.eligible, false)
      assert.equal(r.reason, reason)
    })
  }

  test('class is compared as text, so "8" matches a tutor teaching "8"', () => {
    assert.equal(scoreTutor(lead({ class: '8' }), tutor({ classes: ['8'] }), S).eligible, true)
  })

  test('respects a gender preference only when one is given', () => {
    assert.equal(scoreTutor(lead({ prefGender: 'Male' }), tutor({ gender: 'Female' }), S).reason, 'gender preference')
    assert.equal(scoreTutor(lead({ prefGender: null }), tutor({ gender: 'Female' }), S).eligible, true)
  })

  test('online leads ignore distance and need an online tutor', () => {
    const far = tutor({ ...PLACES.gachibowli, latitude: 12.97, longitude: 77.59 }) // Bengaluru
    const r = scoreTutor(lead({ mode: 'online' }), far, S)
    assert.equal(r.eligible, true)
    assert.equal(r.factors.distance, 100)
    assert.equal(scoreTutor(lead({ mode: 'online' }), tutor({ modes: ['home'] }), S).reason, 'does not offer online tuition')
  })

  test('hybrid leads accept a far tutor who teaches online, but not a far home-only tutor', () => {
    const far = { ...PLACES.gachibowli, serviceRadiusKm: 5 }
    assert.equal(scoreTutor(lead({ mode: 'hybrid' }), tutor({ ...far, modes: ['home', 'online'] }), S).eligible, true)
    assert.equal(scoreTutor(lead({ mode: 'hybrid' }), tutor({ ...far, modes: ['home'] }), S).reason, 'outside service radius')
  })

  test('without coordinates, a tutor in the same pincode is used with an estimated distance', () => {
    const r = scoreTutor(lead({ latitude: null, longitude: null }), tutor({ pincode: PLACES.ameerpet.pincode }), S)
    assert.equal(r.eligible, true)
    assert.equal(r.distanceEstimated, true)
    assert.equal(scoreTutor(lead({ latitude: null, longitude: null, pincode: '500016' }), tutor({ pincode: '500001' }), S).reason, 'location unknown')
  })
})

describe('scoring', () => {
  test('distance uses the configured bands', () => {
    assert.equal(scoreTutor(lead(), tutor(PLACES.begumpet), S).factors.distance, 100) // 1.6 km
    assert.equal(scoreTutor(lead(), tutor(PLACES.secunderabad), S).factors.distance, 70) // 5.3 km
    assert.equal(scoreTutor(lead(), tutor({ ...PLACES.gachibowli, serviceRadiusKm: 12 }), S).factors.distance, 50) // 10.5 km
  })

  test('subject fit counts every requested subject and the board', () => {
    const r = scoreTutor(lead({ subjects: ['Mathematics', 'Science'] }), tutor({ subjects: ['Mathematics'] }), S)
    assert.equal(r.factors.subjectFit, 70) // 60 × 50% + 20 class + 20 board
    assert.equal(scoreTutor(lead(), tutor({ boards: ['ICSE'] }), S).factors.subjectFit, 80)
  })

  test('availability is the share of requested slots the tutor is free for', () => {
    const r = scoreTutor(lead(), tutor({ availability: [{ day: 'tue', slot: 'evening' }] }), S)
    assert.equal(r.factors.availability, 50)
  })

  test('hours count as free for a requested slot when they cover at least an hour of it', () => {
    // Evening is 4–7 PM. Tue 5–7 PM covers two hours; Thu 6:30–9 PM covers only 30 minutes.
    const hours = [{ day: 'tue', start: '17:00', end: '19:00' }, { day: 'thu', start: '18:30', end: '21:00' }]
    assert.equal(scoreTutor(lead(), tutor({ availability: hours }), S).factors.availability, 50)
    const split = [{ day: 'tue', start: '16:00', end: '16:30' }, { day: 'tue', start: '18:00', end: '18:30' }, { day: 'thu', start: '16:00', end: '19:00' }]
    assert.equal(scoreTutor(lead(), tutor({ availability: split }), S).factors.availability, 100, 'two half hours add up to an hour')
  })

  test('closer, better-rated tutors rank first and every result explains itself', () => {
    const near = tutor({ ...PLACES.begumpet, ratingAvg: 4.8, ratingCount: 10 })
    const mid = tutor({ ...PLACES.secunderabad, ratingAvg: 4.6, ratingCount: 10 })
    const far = tutor({ ...PLACES.kukatpally, ratingAvg: 4.3, ratingCount: 10 })
    const { eligible } = rankTutors(lead(), [far, mid, near], S)
    assert.deepEqual(eligible.map(r => r.tutorId), [near.id, mid.id, far.id])
    for (const r of eligible) {
      assert.ok(r.score > 0 && r.score <= 100)
      assert.ok(r.reasons.length >= 3)
    }
  })

  test('weights change the ranking', () => {
    const nearJunior = tutor({ ...PLACES.begumpet, experienceYears: 2 })
    const farSenior = tutor({ ...PLACES.kukatpally, experienceYears: 10 })
    const distanceHeavy = rankTutors(lead(), [nearJunior, farSenior], S).eligible[0].tutorId
    const experienceHeavy = rankTutors(lead(), [nearJunior, farSenior], {
      ...S, weights: { distance: 5, subjectFit: 5, availability: 5, experience: 70, quality: 5, acceptanceReliability: 5, feeFit: 5 },
    }).eligible[0].tutorId
    assert.equal(distanceHeavy, nearJunior.id)
    assert.equal(experienceHeavy, farSenior.id)
  })

  test('fee fit compares the budget range with the tutor fee range', () => {
    const budget = { min: 2000, max: 4000 }
    assert.equal(scoreTutor(lead(), tutor({ feeMin: 2500, feeMax: 3500 }), S, { budget }).factors.feeFit, 100)
    assert.equal(scoreTutor(lead(), tutor({ feeMin: 3500, feeMax: 4500 }), S, { budget }).factors.feeFit, 80)
    assert.equal(scoreTutor(lead(), tutor({ feeMin: 8000, feeMax: 9000 }), S, { budget }).factors.feeFit, 20)
  })

  test('acceptance reliability uses the tutor offer history', () => {
    const t = tutor()
    assert.equal(scoreTutor(lead(), t, S, { stats: { accepted: 1, declined: 3 } }).factors.acceptanceReliability, 25)
  })
})

describe('settings validation', () => {
  test('defaults are valid', () => assert.deepEqual(validateSettings(S), []))

  test('weights must add up to 100', () => {
    const problems = validateSettings({ ...S, weights: { ...S.weights, distance: 40 } })
    assert.ok(problems.some(p => p.includes('add up to 100')))
  })

  test('bands must increase and the home radius cannot exceed the maximum', () => {
    assert.ok(validateSettings({ ...S, distanceBands: [{ maxKm: 5, score: 100 }, { maxKm: 3, score: 50 }] }).length > 0)
    assert.ok(validateSettings({ ...S, defaultHomeRadiusKm: 20 }).some(p => p.includes('cannot exceed')))
  })

  test('unknown weights and bad types are reported', () => {
    assert.ok(validateSettings({ ...S, weights: { ...S.weights, luck: 1 } }).some(p => p.includes('luck')))
    assert.ok(validateSettings({ ...S, offerTimeoutMinutes: 0 }).length > 0)
    assert.ok(validateSettings({ ...S, autoConfirmAssignments: 'yes' }).length > 0)
  })
})

describe('availability helpers', () => {
  const { withoutBooked, timeOffOn, toRanges } = require('../src/services/availability')

  test('booked class slots are cut out of the tutor\'s hours', () => {
    const hours = [{ day: 'mon', start: '15:00', end: '20:00' }, { day: 'tue', start: '16:00', end: '19:00' }]
    assert.deepEqual(withoutBooked(hours, [{ day: 'mon', slot: 'evening' }]), [
      { day: 'mon', start: '15:00', end: '16:00' }, { day: 'mon', start: '19:00', end: '20:00' }, { day: 'tue', start: '16:00', end: '19:00' },
    ])
  })

  test('ranges are sorted and touching ranges merge', () => {
    assert.deepEqual(toRanges([{ day: 'sat', start: '12:00', end: '14:00' }, { day: 'mon', start: '09:00', end: '10:00' }, { day: 'sat', start: '10:00', end: '12:00' }]), [
      { day: 'mon', start: '09:00', end: '10:00' }, { day: 'sat', start: '10:00', end: '14:00' },
    ])
  })

  test('time off covers its first and last day', () => {
    const off = [{ from: '2026-12-24', to: '2026-12-26' }]
    assert.equal(timeOffOn(off, '2026-12-23'), null)
    assert.ok(timeOffOn(off, '2026-12-24'))
    assert.ok(timeOffOn(off, '2026-12-26'))
    assert.equal(timeOffOn(off, '2026-12-27'), null)
  })
})
