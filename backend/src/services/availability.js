// Weekly teaching hours and time off.
//
// A tutor's availability is a list of time ranges: [{ day: 'mon', start: '16:00', end: '19:00' }].
// Parents still ask for broad blocks (slots such as "evening, 4–7 PM"), and class schedules are
// stored as { day, slot }. A tutor counts as free for a requested slot when their hours cover at
// least MIN_LESSON_MINUTES of it (or all of it, for a slot shorter than that).
const M = require('./masters')

const MIN_LESSON_MINUTES = 60
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

const toMinutes = time => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
const toTime = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
const slotWindow = slot => M.SLOTS.find(s => s.value === slot)

// Accepts the current range format and the older { day, slot } format (converted to that slot's
// hours), sorted by day and start time, with overlapping or touching ranges on a day merged.
function toRanges(list) {
  const ranges = (Array.isArray(list) ? list : []).flatMap(item => {
    if (!item || !M.DAYS.includes(item.day)) return []
    if (item.slot) {
      const slot = slotWindow(item.slot)
      return slot ? [{ day: item.day, start: slot.start, end: slot.end }] : []
    }
    return TIME_PATTERN.test(item.start) && TIME_PATTERN.test(item.end) && item.start < item.end ? [{ day: item.day, start: item.start, end: item.end }] : []
  })
  ranges.sort((a, b) => M.DAYS.indexOf(a.day) - M.DAYS.indexOf(b.day) || a.start.localeCompare(b.start))
  const merged = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && last.day === r.day && r.start <= last.end) last.end = r.end > last.end ? r.end : last.end
    else merged.push({ ...r })
  }
  return merged
}

// Minutes of a slot on a day that the ranges cover.
function coveredMinutes(ranges, day, slot) {
  const window = slotWindow(slot)
  if (!window) return 0
  const from = toMinutes(window.start)
  const to = toMinutes(window.end)
  return ranges
    .filter(r => r.day === day)
    .reduce((sum, r) => sum + Math.max(0, Math.min(to, toMinutes(r.end)) - Math.max(from, toMinutes(r.start))), 0)
}

function isFreeFor(ranges, day, slot) {
  const window = slotWindow(slot)
  if (!window) return false
  const needed = Math.min(MIN_LESSON_MINUTES, toMinutes(window.end) - toMinutes(window.start))
  return coveredMinutes(ranges, day, slot) >= needed
}

// Removes the hours of booked class slots ({ day, slot }) from the ranges.
function withoutBooked(ranges, booked) {
  let out = toRanges(ranges)
  for (const { day, slot } of booked) {
    const window = slotWindow(slot)
    if (!window) continue
    const from = toMinutes(window.start)
    const to = toMinutes(window.end)
    out = out.flatMap(r => {
      if (r.day !== day) return [r]
      const start = toMinutes(r.start)
      const end = toMinutes(r.end)
      if (end <= from || start >= to) return [r]
      const pieces = []
      if (start < from) pieces.push({ day, start: r.start, end: toTime(from) })
      if (end > to) pieces.push({ day, start: toTime(to), end: r.end })
      return pieces
    })
  }
  return out
}

// The time-off period covering the date (YYYY-MM-DD), if any.
function timeOffOn(timeOff, date) {
  return (Array.isArray(timeOff) ? timeOff : []).find(t => t && t.from <= date && date <= t.to) || null
}

module.exports = { MIN_LESSON_MINUTES, TIME_PATTERN, toMinutes, toRanges, coveredMinutes, isFreeFor, withoutBooked, timeOffOn }
