'use client'

import { DAY_LABELS, SLOT_SHORT } from '@/shared/lib/format'

// Weekly slot grid (used for class schedules): days across, time slots down. value = [{ day, slot }].
export default function SlotGrid({ days, slots, value: rawValue, onChange, label = 'Weekly availability', hint = 'Tap each time you can usually teach.', error }) {
  const value = Array.isArray(rawValue) ? rawValue : []
  const has = (day, slot) => value.some(v => v.day === day && v.slot === slot)
  const toggle = (day, slot) => onChange(has(day, slot) ? value.filter(v => !(v.day === day && v.slot === slot)) : [...value, { day, slot }])
  const on = 'border-ink/60 bg-lemon text-ink'

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink">{label}</legend>
      <p className="mb-2 text-xs text-sage">{hint} {value.length} selected.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] table-fixed border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th scope="col" className="w-28 text-left font-medium text-sage"><span className="sr-only">Time</span></th>
              {days.map(d => <th key={d} scope="col" className="font-semibold text-ink/80">{DAY_LABELS[d]}</th>)}
            </tr>
          </thead>
          <tbody>
            {slots.map(s => {
              const slot = s.value ?? s
              return (
                <tr key={slot}>
                  <th scope="row" className="pr-2 text-left font-medium text-sage">{SLOT_SHORT[slot] || s.label}</th>
                  {days.map(day => {
                    const active = has(day, slot)
                    return (
                      <td key={day}>
                        <button
                          type="button"
                          aria-pressed={active}
                          aria-label={`${DAY_LABELS[day]} ${SLOT_SHORT[slot]}`}
                          onClick={() => toggle(day, slot)}
                          className={`h-8 w-full rounded-full border text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${active ? on : 'border-sand-200 bg-white text-sage-soft hover:bg-sand-50'}`}
                        >
                          {active ? '✓' : ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </fieldset>
  )
}
