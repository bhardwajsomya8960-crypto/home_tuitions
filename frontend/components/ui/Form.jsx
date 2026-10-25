'use client'

import { useId } from 'react'

// Form primitives. Each input shows its error under the field and links it with aria-describedby.

export const inputClass = error =>
  `w-full min-h-[44px] rounded-lg border bg-white px-3 py-2 text-base sm:text-sm text-ink outline-none transition focus:ring-2 ${
    error ? 'border-red-400 focus:ring-red-200' : 'border-sand-300 focus:border-transparent focus:ring-ink'
  }`

export function Field({ label, required, hint, error, children, className = '' }) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <div className={className}>
      {label && (
        <label id={`${id}-label`} htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
          {label}{required && <span className="text-red-600" aria-hidden="true"> *</span>}
        </label>
      )}
      {typeof children === 'function' ? children({ id, labelId: `${id}-label`, describedBy, invalid: !!error }) : children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-sage">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

export function TextInput({ label, required, hint, error, className, ...props }) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <input id={id} aria-describedby={describedBy} aria-invalid={invalid} aria-required={required} className={inputClass(error)} {...props} />
      )}
    </Field>
  )
}

export function TextArea({ label, required, hint, error, className, rows = 3, ...props }) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea id={id} rows={rows} aria-describedby={describedBy} aria-invalid={invalid} aria-required={required} className={inputClass(error)} {...props} />
      )}
    </Field>
  )
}

// options: [{ value, label }] or strings
export function Select({ label, required, hint, error, className, options = [], placeholder = 'Select…', ...props }) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <select id={id} aria-describedby={describedBy} aria-invalid={invalid} aria-required={required} className={inputClass(error)} {...props}>
          <option value="">{placeholder}</option>
          {options.map(o => {
            const value = o.value ?? o
            return <option key={value} value={value}>{o.label ?? o}</option>
          })}
        </select>
      )}
    </Field>
  )
}

// Multi-select (or single with `single`) shown as toggle chips. Works with keyboard and screen readers.
export function ChipGroup({ label, required, hint, error, options = [], value = [], onChange, single = false, className }) {
  const selected = single ? (value ? [value] : []) : value
  const on = 'bg-ink text-white border-ink'
  const toggle = v => {
    if (single) return onChange(v === value ? '' : v)
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  }
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className}>
      {({ labelId, describedBy }) => (
        <div role={single ? 'radiogroup' : 'group'} aria-labelledby={labelId} aria-describedby={describedBy} className="flex flex-wrap gap-2">
          {options.map(o => {
            const v = o.value ?? o
            const active = selected.includes(v)
            return (
              <button
                key={v}
                type="button"
                role={single ? 'radio' : 'checkbox'}
                aria-checked={active}
                onClick={() => toggle(v)}
                className={`min-h-[40px] rounded-full border px-3.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-ink ${active ? on : 'border-sand-300 bg-white text-ink/80 hover:bg-sand-50'}`}
              >
                {o.label ?? o}
              </button>
            )
          })}
        </div>
      )}
    </Field>
  )
}

export function Checkbox({ label, checked, onChange, error, children }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-ink/80">
        <input id={id} type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded border-sand-300" aria-invalid={!!error} />
        <span>{label || children}</span>
      </label>
      {error && <p role="alert" className="ml-8 mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

export function Notice({ tone = 'error', children }) {
  if (!children) return null
  const tones = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-green-200 bg-green-50 text-green-800',
    info: 'border-lavender bg-lavender/50 text-ink',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  }
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
}
