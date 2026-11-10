'use client'

import { usePathname } from 'next/navigation'

// Two happy students at a desk, one on a laptop and one with a book and a hand up, while ideas
// float up between them (a light bulb, sparkles, a globe for research, 100 points, books).
// Purely decorative: it ignores taps, is hidden from screen readers, and stands still for
// visitors who turn off motion. Two placements:
//   - StudyCorner: fixed in the bottom-left corner on large screens (public pages).
//   - StudyCornerInline: part of the page on phones and tablets (in the homepage hero), where
//     a fixed scene would cover the text and the callback form.
// Animations: "Study corner" in app/globals.css.
// Artwork: Microsoft Fluent Emoji, MIT licence (public/study-corner/LICENSE.txt).
const SHOWN_ON = path => path === '/' || path.startsWith('/courses') || path.startsWith('/categories')

// Each idea floats up in turn, alternately drifting left and right.
const IDEAS = ['idea-bulb', 'idea-sparkles', 'idea-globe', 'idea-100', 'idea-books']

const art = (name, size, className = '', style) => (
  <img src={`/study-corner/${name}.png`} alt="" width={size} height={size} draggable={false} decoding="async" className={className} style={style} />
)

// The scene itself, drawn in a 240 x 160 box.
function Scene() {
  return (
    <>
      {/* ideas rising from between the two students */}
      <div className="absolute bottom-[88px] left-[106px] h-7 w-7">
        {IDEAS.map((name, i) => (
          <span key={name}>
            {art(name, 28, 'sc-idea absolute inset-0 h-7 w-7', { animationDelay: `${i * 1.2}s`, '--sc-drift': `${i % 2 ? 16 : -16}px` })}
          </span>
        ))}
      </div>

      {/* the students, sitting behind the desk */}
      <div className="absolute bottom-[18px] left-1">
        {art('student-laptop', 92, 'sc-type h-[92px] w-[92px] origin-bottom')}
      </div>
      <div className="absolute bottom-[18px] right-1">
        {art('student-hand-up', 92, 'sc-cheer h-[92px] w-[92px] origin-bottom')}
      </div>

      {/* the desk, with an open book and a pencil writing on its right-hand page */}
      <div className="absolute inset-x-0 bottom-0 h-[30px] rounded-2xl border border-ink/10 bg-sand-300 shadow-[inset_0_6px_0_#E9E1CB]" />
      <div className="sc-book absolute bottom-[10px] right-[66px]">
        {art('open-book', 46, 'h-[46px] w-[46px]')}
        <div className="absolute bottom-[14px] left-[24px]">
          {art('pencil', 24, 'sc-write h-6 w-6')}
        </div>
      </div>
    </>
  )
}

export default function StudyCorner() {
  const pathname = usePathname() || '/'
  if (!SHOWN_ON(pathname)) return null

  return (
    <div aria-hidden="true" className="sc-scene pointer-events-none fixed bottom-3 left-3 z-30 hidden h-[160px] w-[240px] origin-bottom-left select-none lg:block 2xl:scale-[1.3]">
      <Scene />
    </div>
  )
}

export function StudyCornerInline({ className = '' }) {
  return (
    <div aria-hidden="true" className={`sc-scene pointer-events-none relative h-[160px] w-[240px] select-none lg:hidden ${className}`}>
      <Scene />
    </div>
  )
}
