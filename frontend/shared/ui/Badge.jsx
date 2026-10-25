const TONES = {
  gray: 'bg-sand-100 text-ink/80',
  slate: 'bg-sand-100 text-sage',
  sky: 'bg-sky-100 text-sky-900',
  blue: 'bg-lavender text-ink',
  indigo: 'bg-indigo-100 text-indigo-900',
  teal: 'bg-mint text-ink',
  purple: 'bg-lavender text-ink',
  violet: 'bg-violet-100 text-violet-800',
  green: 'bg-mint text-green-900',
  amber: 'bg-amber-100 text-amber-800',
  yellow: 'bg-lemon text-ink',
  red: 'bg-red-100 text-red-700',
}

export default function Badge({ tone = 'gray', children }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone] || TONES.gray}`}>{children}</span>
}

// Renders a status using one of the maps in lib/format.js.
export function StatusBadge({ map, value }) {
  const entry = map[value] || { label: value, tone: 'gray' }
  return <Badge tone={entry.tone}>{entry.label}</Badge>
}
