// Lemon-spark mark: a lemon with a small spark, used as the brand signature.
export default function Logo({ className = 'w-9 h-9' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="20" cy="22" rx="13" ry="10.5" fill="#F7E96B" stroke="#26352F" strokeWidth="1.5" transform="rotate(-18 20 22)" />
      <path d="M6.5 16.5 L3.5 13.5 M7.5 13 L5.5 9.5" stroke="#26352F" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M31 9 L32.2 12.2 L35.5 13.4 L32.2 14.6 L31 17.8 L29.8 14.6 L26.5 13.4 L29.8 12.2 Z" fill="#FFAB91" />
    </svg>
  )
}
