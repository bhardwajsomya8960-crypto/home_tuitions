'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiMenu, FiPhone, FiX } from 'react-icons/fi'
import Logo, { BRAND_NAME } from '@/shared/brand/Logo'
import { CONTACT } from '@/features/website/contact'

// Shown without +91 in the header to save space; the call link still dials +91.
const localPhone = CONTACT.phone.replace(/^\+?91\s*/, '')

const NAV = [
  { href: '/courses', label: 'Courses' },
  { href: '/#learning-match', label: 'Find a Tutor' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#for-tutors', label: 'For Tutors' },
  { href: '/#enquire', label: 'Contact' },
]

// ctaHref: where "Find My Tutor" goes; city pages point it at their own form.
export default function SiteHeader({ ctaHref = '/#enquire' }) {
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

  const linkClass = 'whitespace-nowrap text-ink/80 hover:text-ink font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory rounded-md px-1 py-0.5'
  const btnBase = 'inline-flex whitespace-nowrap items-center justify-center rounded-full font-semibold transition-transform duration-150 motion-safe:hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory'

  return (
    <header
      className={`sticky top-0 z-50 bg-ivory transition-[box-shadow,border-color] duration-200 border-b ${
        scrolled ? 'border-ink/10 shadow-sm' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 xl:gap-6">
        {/* Icon only; its alt text names the link for screen readers and search engines. */}
        <Link href="/" title="Home" className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory">
          <Logo className="h-11 w-11" alt={BRAND_NAME} />
        </Link>

        <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-4 lg:flex xl:gap-6">
          {NAV.map(item => (
            <a key={item.href} href={item.href} className={linkClass}>{item.label}</a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 lg:ml-0 lg:gap-2 xl:gap-3">
          {/* Tap to call. A round icon on phones and smaller laptops, the full number on wide
              screens. Below 360px there is no room, so it moves into the menu only. */}
          <a href={CONTACT.phoneHref} aria-label={`Call us on ${CONTACT.phone}`} title={`Call ${CONTACT.phone}`}
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink/40 hover:bg-mint/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory min-[360px]:inline-flex xl:w-auto xl:gap-2 xl:border-0 xl:px-1 xl:hover:bg-transparent">
            <span className="flex h-8 w-8 items-center justify-center rounded-full xl:h-7 xl:w-7 xl:bg-mint" aria-hidden="true">
              <FiPhone className="h-[18px] w-[18px]" />
            </span>
            <span className="hidden whitespace-nowrap text-sm font-semibold xl:inline">{localPhone}</span>
          </a>
          {/* Sign in is hidden for now (the backend is not deployed). Uncomment to bring it back,
              together with the one in the mobile menu below.
          <Link href="/login" className={`${linkClass} hidden px-2 text-sm lg:inline-flex`}>Sign in</Link>
          */}
          <a href="/#enquire-tutor" className={`${linkClass} hidden px-3 lg:inline-flex`}>I&apos;m a Tutor</a>
          <a href={ctaHref} className={`${btnBase} h-10 shrink-0 bg-lemon px-5 text-ink shadow-[0_1px_0_rgba(38,53,47,0.9)] border border-ink hover:bg-[#f2e04f]`}>
            Find My Tutor
          </a>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
          >
            {open ? <FiX className="h-5 w-5" aria-hidden="true" /> : <FiMenu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-t border-ink/10 bg-ivory lg:hidden"
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
              {/* Sign in is hidden for now (the backend is not deployed). Uncomment to bring it back.
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex min-h-[48px] items-center rounded-xl px-3 text-base font-medium text-ink hover:bg-mint/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                Sign in
              </Link>
              */}
              <a href="/#enquire-tutor"
                onClick={() => setOpen(false)}
                className="flex min-h-[48px] items-center rounded-xl px-3 text-base font-medium text-ink hover:bg-mint/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                I&apos;m a Tutor
              </a>
              <a href={CONTACT.phoneHref}
                onClick={() => setOpen(false)}
                className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-base font-semibold text-ink hover:bg-mint/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                <FiPhone className="h-5 w-5" aria-hidden="true" /> Call {CONTACT.phone}
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
