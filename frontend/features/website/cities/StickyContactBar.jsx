'use client'

import { useEffect, useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { FiPhone } from 'react-icons/fi'
import { CONTACT } from '@/features/website/contact'
import TrackedLink from './TrackedLink'

// WhatsApp + Call, pinned to the bottom of the screen on phones and tablets. It slides in once
// the hero's WhatsApp button (#hero-cta) has scrolled away, so the same two buttons are never
// on screen twice. It is fixed and the page reserves its height with bottom padding
// (CityPage), so it never shifts the layout or covers the footer. The floating WhatsApp
// button is hidden on these pages below lg (WhatsAppWidget), so the two never overlap.
export default function StickyContactBar({ whatsappHref, track }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('hero-cta')
    if (!hero || typeof IntersectionObserver === 'undefined') { setShown(true); return undefined }
    const observer = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0))
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  const btn = 'flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-ink text-base font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2'
  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-ivory/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgba(38,53,47,0.25)] transition-transform duration-200 motion-reduce:transition-none lg:hidden ${shown ? 'translate-y-0' : 'pointer-events-none translate-y-full'}`}
      aria-hidden={!shown} inert={shown ? undefined : ''}>
      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        <TrackedLink href={whatsappHref} target="_blank" rel="noopener noreferrer" track={{ ...track, method: 'whatsapp' }} className={`${btn} bg-[#25D366]`}>
          <FaWhatsapp className="h-5 w-5" aria-hidden="true" /> WhatsApp
        </TrackedLink>
        <TrackedLink href={CONTACT.phoneHref} track={{ ...track, method: 'call' }} className={`${btn} bg-white`} aria-label={`Call ${CONTACT.phone}`}>
          <FiPhone className="h-5 w-5" aria-hidden="true" /> Call
        </TrackedLink>
      </div>
    </div>
  )
}
