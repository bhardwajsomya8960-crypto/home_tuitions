'use client'

import { FiCopy, FiPlus, FiX } from 'react-icons/fi'
import { DAY_NAMES, timeLabel } from '../../lib/format'

// Weekly teaching hours: a switch per day, and one or more time ranges on each day that is on.
// value = [{ day, start: 'HH:MM', end: 'HH:MM' }]
const STEP = 30
const FIRST = 6 * 60
const LAST = 22 * 60
const toTime = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const toMinutes = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
const TIMES = Array.from({ length: (LAST - FIRST) / STEP + 1 }, (_, i) => toTime(FIRST + i * STEP))
const DEFAULT_RANGE = { start: '16:00', end: '19:00' }

// The first problem with the hours, or '' when they are fine.
export function hoursProblem(value) {
  if (!value.length) return 'Turn on at least one day you can teach.'
  for (const r of value) if (r.start >= r.end) return `On ${DAY_NAMES[r.day]}, each end time must be after its start time.`
  const byDay = {}
  for (const r of value) (byDay[r.day] ||= []).push(r)
  for (const [day, ranges] of Object.entries(byDay)) {
    const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start))
    for (let i = 1; i < sorted.length; i++) if (sorted[i].start < sorted[i - 1].end) return `On ${DAY_NAMES[day]}, the times overlap.`
  }
  return ''
}

export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${checked ? 'bg-sage' : 'bg-sand-300'}`}>
      <span aria-hidden="true" className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  )
}

function TimeSelect({ value, onChange, label, min, max }) {
  return (
    <select aria-label={label} value={value} onChange={e => onChange(e.target.value)}
      className="h-10 w-32 rounded-lg border border-sand-300 bg-white px-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink">
      {TIMES.filter(t => (!min || t > min) && (!max || t < max)).map(t => <option key={t} value={t}>{timeLabel(t)}</option>)}
    </select>
  )
}

export default function WeeklyHours({ days, value: rawValue, onChange, error, label = 'Weekly hours', hint = 'Turn on the days you teach and set your hours. Add more than one time on a day if you take a break.' }) {
  const value = Array.isArray(rawValue) ? rawValue : []
  const rangesOf = day => value.filter(r => r.day === day)
  const replaceDay = (day, ranges) => onChange([...value.filter(r => r.day !== day), ...ranges.map(r => ({ day, start: r.start, end: r.end }))]
    .sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day) || a.start.localeCompare(b.start)))

  const toggle = (day, on) => replaceDay(day, on ? [DEFAULT_RANGE] : [])
  const update = (day, index, patch) => {
    const ranges = rangesOf(day).map((r, i) => (i === index ? { ...r, ...patch } : r))
    // Keep the end after the start when the start moves past it.
    const r = ranges[index]
    if (r.end <= r.start) r.end = toTime(Math.min(LAST, toMinutes(r.start) + 60))
    replaceDay(day, ranges)
  }
  // Where a new range fits: the first free gap after the day's last range, otherwise the largest
  // free gap earlier in the day. New ranges keep half an hour from existing ones (touching ranges
  // would merge into one when saved) and last up to two hours. Null when the day has no room.
  const nextRange = day => {
    const taken = rangesOf(day).map(r => [toMinutes(r.start), toMinutes(r.end)]).sort((a, b) => a[0] - b[0])
    const gaps = []
    let cursor = FIRST
    for (const [start, end] of taken) {
      gaps.push([cursor === FIRST ? cursor : cursor + STEP, start - STEP])
      cursor = Math.max(cursor, end)
    }
    gaps.push([taken.length ? cursor + STEP : FIRST, LAST])
    const usable = gaps.filter(([from, to]) => to - from >= 60)
    if (!usable.length) return null
    const lastEnd = taken.length ? taken[taken.length - 1][1] : FIRST
    const [from, to] = usable.find(([g]) => g > lastEnd) || usable.reduce((best, g) => (g[1] - g[0] > best[1] - best[0] ? g : best))
    return { start: toTime(from), end: toTime(Math.min(to, from + 120)) }
  }
  const copyToAll = day => onChange(days.flatMap(d => rangesOf(day).map(r => ({ day: d, start: r.start, end: r.end }))))

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-ink">{label}</legend>
      {hint && <p className="mb-3 text-xs text-sage">{hint}</p>}
      <ul className="divide-y divide-sand-100 rounded-xl border border-sand-200 bg-white">
        {days.map(day => {
          const ranges = rangesOf(day)
          const on = ranges.length > 0
          const next = on && nextRange(day)
          return (
            <li key={day} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start">
              <div className="flex min-w-[150px] items-center gap-3 sm:h-10">
                <Switch checked={on} onChange={v => toggle(day, v)} label={`Available on ${DAY_NAMES[day]}`} />
                <span className={`text-sm font-semibold ${on ? 'text-ink' : 'text-sage'}`}>{DAY_NAMES[day]}</span>
              </div>
              {on ? (
                <div className="flex flex-1 flex-col gap-2">
                  {ranges.map((r, i) => (
                    <div key={`${r.start}-${i}`} className="flex flex-wrap items-center gap-2">
                      <TimeSelect label={`${DAY_NAMES[day]} start time ${i + 1}`} value={r.start} max="22:00" onChange={start => update(day, i, { start })} />
                      <span className="text-sm text-sage">to</span>
                      <TimeSelect label={`${DAY_NAMES[day]} end time ${i + 1}`} value={r.end} min={r.start} onChange={end => update(day, i, { end })} />
                      <button type="button" aria-label={`Remove ${timeLabel(r.start)} to ${timeLabel(r.end)} on ${DAY_NAMES[day]}`} onClick={() => replaceDay(day, ranges.filter((_, j) => j !== i))}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sage hover:bg-sand-100 hover:text-ink">
                        <FiX className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <button type="button" disabled={!next} title={next ? undefined : 'No free time left on this day between 6 AM and 10 PM'}
                      onClick={() => next && replaceDay(day, [...ranges, next])}
                      className="inline-flex min-h-[32px] items-center gap-1.5 text-sm font-semibold text-ink underline decoration-lemon decoration-2 underline-offset-4 hover:decoration-ink disabled:cursor-not-allowed disabled:text-sage-soft disabled:no-underline">
                      <FiPlus className="h-4 w-4" aria-hidden="true" /> Add more hours
                    </button>
                    <button type="button" onClick={() => copyToAll(day)} className="inline-flex min-h-[32px] items-center gap-1.5 text-sm text-sage hover:text-ink"><FiCopy className="h-4 w-4" aria-hidden="true" /> Copy to all days</button>
                  </div>
                  {!next && <p className="text-xs text-sage">This day is full. Change a time above to make room.</p>}
                </div>
              ) : (
                <p className="text-sm text-sage sm:leading-10">Unavailable</p>
              )}
            </li>
          )
        })}
      </ul>
      {error && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </fieldset>
  )
}
