'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiArrowRight, FiCheck } from 'react-icons/fi'

const MODES = [
  { value: 'Home', label: 'Home', hint: 'At your home' },
  { value: 'Online', label: 'Online', hint: 'From anywhere' },
]
const STAGES = [
  { value: 'Primary', label: 'Primary' },
  { value: 'Middle School', label: 'Middle School' },
  { value: 'Secondary', label: 'Secondary' },
]
const GOALS = [
  { value: 'Build Confidence', label: 'Build confidence' },
  { value: 'Improve Grades', label: 'Improve grades' },
  { value: 'Exam Preparation', label: 'Exam preparation' },
]

function ChoiceGroup({ legend, options, value, onChange, name }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label={legend}>
        {options.map(opt => {
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              data-group={name}
              onClick={() => onChange(selected ? undefined : opt.value)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm font-medium transition-[background-color,transform,border-color] duration-200 motion-safe:active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                selected
                  ? 'border-ink bg-lemon text-ink'
                  : 'border-ink/20 bg-white text-ink hover:border-ink/50'
              }`}
            >
              {selected && <FiCheck className="h-4 w-4" aria-hidden="true" />}
              {opt.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function LearningMatch() {
  const [mode, setMode] = useState()
  const [stage, setStage] = useState()
  const [goal, setGoal] = useState()

  const href = mode ? `/parent/register?mode=${encodeURIComponent(mode)}` : '/parent/register'
  const picked = [mode, stage, goal].filter(Boolean)

  return (
    <div className="rounded-[28px] border border-ink/10 bg-white p-5 shadow-[0_1px_0_rgba(38,53,47,0.06)] sm:p-7">
      <div className="grid gap-6 md:grid-cols-[1fr_1fr_1fr] md:gap-5">
        <ChoiceGroup legend="Learning mode" name="mode" options={MODES} value={mode} onChange={setMode} />
        <ChoiceGroup legend="School stage" name="stage" options={STAGES} value={stage} onChange={setStage} />
        <ChoiceGroup legend="Main goal" name="goal" options={GOALS} value={goal} onChange={setGoal} />
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-sage" aria-live="polite">
          {picked.length === 0 ? (
            'Pick any options above to describe what your child needs.'
          ) : (
            <>
              Your choice:{' '}
              <span className="font-semibold text-ink">{picked.join(' · ')}</span>
              {mode && <span className="block text-xs text-sage">Your learning mode will be pre-selected in the enquiry form.</span>}
            </>
          )}
        </p>
        <Link
          href={href}
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-full border border-ink bg-lemon px-6 font-semibold text-ink transition-transform duration-150 motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Find My Tutor
          <FiArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
