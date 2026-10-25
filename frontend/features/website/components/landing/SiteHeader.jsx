'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiMenu, FiX } from 'react-icons/fi'
import Logo, { BRAND_NAME } from '@/shared/brand/Logo'

const NAV = [
  { href: '/courses', label: 'Courses' },
  { href: '#learning-match', label: 'Find a Tutor' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#for-tutors', label: 'For Tutors' },
]

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const linkClass = 'text-ink/80 hover:text-ink font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory rounded-md px-1 py-0.5'
  const btnBase = 'inline-flex items-center justify-center rounded-full font-semibold transition-transform duration-150 motion-safe:hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory'

  return (
    <header
      className={`sticky top-0 z-50 bg-ivory transition-[box-shadow,border-color] duration-200 border-b ${
        scrolled ? 'border-ink/10 shadow-sm' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory">
          <Logo className="h-11 w-11" />
          <span className="text-lg font-bold tracking-tight text-ink">{BRAND_NAME}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {NAV.map(item => (
            <a key={item.href} href={item.href} className={linkClass}>{item.label}</a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/tutor/register" className={`${linkClass} px-3`}>I&apos;m a Tutor</Link>
          <Link href="/parent/register" className={`${btnBase} h-10 bg-lemon px-5 text-ink shadow-[0_1px_0_rgba(38,53,47,0.9)] border border-ink hover:bg-[#f2e04f]`}>
            Find My Tutor
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
        >
          {open ? <FiX className="h-5 w-5" aria-hidden="true" /> : <FiMenu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-t border-ink/10 bg-ivory md:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-col gap-1 px-4 py-4">
              {NAV.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[48px] items-center rounded-xl px-3 text-base font-medium text-ink hover:bg-mint/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/tutor/register"
                onClick={() => setOpen(false)}
                className="flex min-h-[48px] items-center rounded-xl px-3 text-base font-medium text-ink hover:bg-mint/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                I&apos;m a Tutor
              </Link>
              <Link
                href="/parent/register"
                onClick={() => setOpen(false)}
                className="mt-2 flex min-h-[48px] items-center justify-center rounded-full border border-ink bg-lemon px-5 text-base font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
              >
                Find My Tutor
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
