'use client'

import { DAY_LABELS, SLOT_SHORT } from '../../lib/format'

// Weekly availability grid: days across, time slots down. value = [{ day, slot }].
export default function SlotGrid({ days, slots, value = [], onChange, label = 'Weekly availability', hint = 'Tap each time you can usually teach.', error, accent = 'blue' }) {
  const has = (day, slot) => value.some(v => v.day === day && v.slot === slot)
  const toggle = (day, slot) => onChange(has(day, slot) ? value.filter(v => !(v.day === day && v.slot === slot)) : [...value, { day, slot }])
  const on = accent === 'purple' ? 'bg-purple-600 text-white border-purple-600' : accent === 'ink' ? 'bg-ink text-white border-ink' : 'bg-blue-600 text-white border-blue-600'

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-gray-800">{label}</legend>
      <p className="mb-2 text-xs text-gray-500">{hint} {value.length} selected.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] table-fixed border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th scope="col" className="w-28 text-left font-medium text-gray-500"><span className="sr-only">Time</span></th>
              {days.map(d => <th key={d} scope="col" className="font-semibold text-gray-700">{DAY_LABELS[d]}</th>)}
            </tr>
          </thead>
          <tbody>
            {slots.map(s => {
              const slot = s.value ?? s
              return (
                <tr key={slot}>
                  <th scope="row" className="pr-2 text-left font-medium text-gray-600">{SLOT_SHORT[slot] || s.label}</th>
                  {days.map(day => {
                    const active = has(day, slot)
                    return (
                      <td key={day}>
                        <button
                          type="button"
                          aria-pressed={active}
                          aria-label={`${DAY_LABELS[day]} ${SLOT_SHORT[slot]}`}
                          onClick={() => toggle(day, slot)}
                          className={`h-10 w-full rounded-md border text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${active ? on : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50'}`}
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
