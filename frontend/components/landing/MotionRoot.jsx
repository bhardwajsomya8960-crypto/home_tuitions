'use client'

import { MotionConfig } from 'framer-motion'

// "user" honours prefers-reduced-motion: transform animations are dropped, opacity remains.
export default function MotionRoot({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
