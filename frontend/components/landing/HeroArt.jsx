'use client'

import { motion, useReducedMotion } from 'framer-motion'

// Original abstract illustration: a notebook with doodles, a lemon sun and small floating shapes.
// Only the two small shapes move, and only when the visitor has not asked for reduced motion.
export default function HeroArt() {
  const reduce = useReducedMotion()
  const drift = (amount, duration) =>
    reduce ? {} : { animate: { y: [0, -amount, 0] }, transition: { duration, repeat: Infinity, ease: 'easeInOut' } }

  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[520px]">
      <svg viewBox="0 0 520 416" className="absolute inset-0 h-full w-full" role="img" aria-label="Illustration of a notebook with maths doodles, a lemon sun and paper plane">
        {/* soft backdrop */}
        <circle cx="300" cy="210" r="170" fill="#E7DEFF" />
        <circle cx="120" cy="330" r="46" fill="#CDEDD8" />

        {/* notebook */}
        <g transform="rotate(-4 250 220)">
          <rect x="110" y="95" width="290" height="236" rx="22" fill="#FFFFFF" stroke="#26352F" strokeWidth="2" />
          <rect x="110" y="95" width="26" height="236" rx="13" fill="#F7E96B" stroke="#26352F" strokeWidth="2" />
          {[140, 170, 200, 230, 260, 290].map(y => (
            <line key={y} x1="160" x2="380" y1={y} y2={y} stroke="#CDEDD8" strokeWidth="2" strokeLinecap="round" />
          ))}
          {/* doodles */}
          <text x="170" y="150" fontSize="30" fontWeight="700" fill="#26352F" fontFamily="system-ui, sans-serif">7 + 5 = 12</text>
          <path d="M170 186 q14 -12 28 0 t28 0 t28 0" fill="none" stroke="#FFAB91" strokeWidth="3" strokeLinecap="round" />
          <text x="170" y="250" fontSize="26" fontWeight="700" fill="#26352F" fontFamily="system-ui, sans-serif">π ≈ 3.14</text>
          <path d="M300 226 l10 10 l20 -22" fill="none" stroke="#26352F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* pencil */}
        <g transform="rotate(28 400 330)">
          <rect x="350" y="318" width="120" height="22" rx="4" fill="#FFAB91" stroke="#26352F" strokeWidth="2" />
          <path d="M470 318 L492 329 L470 340 Z" fill="#F7E96B" stroke="#26352F" strokeWidth="2" strokeLinejoin="round" />
          <rect x="350" y="318" width="20" height="22" fill="#26352F" />
        </g>

        {/* paper plane */}
        <path d="M56 150 L150 118 L118 206 L100 176 Z" fill="#FFFFFF" stroke="#26352F" strokeWidth="2" strokeLinejoin="round" />
        <path d="M100 176 L150 118 L118 206 Z" fill="#CDEDD8" stroke="#26352F" strokeWidth="2" strokeLinejoin="round" />
      </svg>

      {/* lemon sun */}
      <motion.div className="absolute right-[6%] top-[6%] h-24 w-24 sm:h-28 sm:w-28" {...drift(8, 6)}>
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true" focusable="false">
          <ellipse cx="60" cy="62" rx="40" ry="34" fill="#F7E96B" stroke="#26352F" strokeWidth="2" transform="rotate(-14 60 62)" />
          <path d="M14 42 L8 36 M20 30 L16 22" stroke="#26352F" strokeWidth="2" strokeLinecap="round" />
          <path d="M98 26 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 l9 -4 Z" fill="#FFAB91" />
        </svg>
      </motion.div>

      {/* floating shapes */}
      <motion.div className="absolute bottom-[10%] left-[4%] h-14 w-14 rounded-2xl bg-lavender ring-2 ring-ink/80 sm:h-16 sm:w-16" {...drift(6, 5)} aria-hidden="true" />
      <div className="absolute left-[14%] top-[10%] h-5 w-5 rounded-full bg-coral" aria-hidden="true" />
      <div className="absolute bottom-[4%] right-[18%] h-3 w-3 rounded-full bg-ink" aria-hidden="true" />
    </div>
  )
}
