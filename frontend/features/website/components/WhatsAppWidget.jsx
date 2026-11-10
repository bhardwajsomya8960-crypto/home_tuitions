'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { FaWhatsapp } from 'react-icons/fa'
import { FiX } from 'react-icons/fi'
import { BRAND_NAME } from '@/shared/brand/Logo'
import { whatsappLink } from '@/features/website/contact'
import { isCityPath } from '@/features/website/cities/cities.config'

// The first message typed in for the visitor, by who they are. Change the wording here.
const CHOICES = [
  { id: 'student', label: "I'm a student or parent", message: "Hello! I'm a student and I would like to enquire about home tuition. Please share the details." },
  { id: 'tutor', label: "I'm a tutor", message: "Hello! I'm a tutor and I would like to teach with you. Please share the details." },
]

// The portals have their own navigation along the bottom edge, so the button stays off them.
const HIDDEN_ON = ['/admin', '/parent/dashboard', '/tutor/dashboard']

const choiceBtn = 'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-ink bg-[#25D366] px-5 text-[15px] font-semibold text-ink shadow-[0_1px_0_rgba(38,53,47,0.9)] transition-transform duration-150 motion-safe:hover:-translate-y-0.5 hover:bg-[#2fe072] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2'

// Floating WhatsApp button (bottom right). Opens a small card asking whether the visitor is a
// student or a tutor, then opens WhatsApp with a matching message ready to send.
export default function WhatsAppWidget() {
  const pathname = usePathname() || '/'
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const firstChoiceRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    firstChoiceRef.current?.focus()
    const onKey = e => {
      if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus() }
    }
    const onPointer = e => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  if (HIDDEN_ON.some(path => pathname.startsWith(path))) return null
  // City pages have their own WhatsApp + Call bar on phones, so the button shows on large screens only.
  const onCityPage = isCityPath(pathname)

  // The wrapper lets taps through: while the card is closed it still takes up space, and on a
  // phone that space covers the lower half of the screen (the callback form included). Only the
  // button, and the card while open, take taps.
  return (
    <div ref={rootRef} className={`pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 flex-col items-end gap-3 sm:bottom-6 sm:right-6 ${onCityPage ? 'hidden lg:flex' : 'flex'}`}>
      <div
        id="whatsapp-chooser"
        role="dialog"
        aria-labelledby="whatsapp-chooser-title"
        className={`w-[min(20rem,calc(100vw-2rem))] origin-bottom-right rounded-3xl border border-ink/10 bg-white p-4 shadow-[0_20px_50px_-12px_rgba(38,53,47,0.35)] transition duration-150 ease-out motion-reduce:transition-none ${open ? 'pointer-events-auto visible scale-100 opacity-100' : 'invisible scale-95 opacity-0'}`}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white" aria-hidden="true">
            <FaWhatsapp className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p id="whatsapp-chooser-title" className="font-bold leading-tight text-ink">{BRAND_NAME}</p>
            <p className="text-sm text-sage">Chat with us on WhatsApp</p>
          </div>
          <button type="button" onClick={() => { setOpen(false); buttonRef.current?.focus() }} aria-label="Close"
            className="-mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-full text-sage hover:bg-sand-50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink">
            <FiX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-4 rounded-2xl rounded-tl-md bg-sand-50 px-4 py-3 text-[15px] leading-relaxed text-ink">
          Hi there! 👋 Are you a student or a tutor? Choose one and we&apos;ll open WhatsApp with a message ready to send.
        </p>

        <div className="mt-4 space-y-2">
          {CHOICES.map((choice, i) => (
            <a key={choice.id} ref={i === 0 ? firstChoiceRef : undefined} href={whatsappLink(choice.message)}
              target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={choiceBtn}>
              <FaWhatsapp className="h-5 w-5" aria-hidden="true" /> {choice.label}
            </a>
          ))}
        </div>
      </div>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="whatsapp-chooser"
        aria-label={open ? 'Close WhatsApp chat' : 'Chat with us on WhatsApp'}
        title="Chat with us on WhatsApp"
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-6px_rgba(37,211,102,0.65)] ring-1 ring-ink/10 transition-transform duration-150 motion-safe:hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 sm:h-16 sm:w-16"
      >
        {open ? <FiX className="h-7 w-7" aria-hidden="true" /> : <FaWhatsapp className="h-8 w-8 sm:h-9 sm:w-9" aria-hidden="true" />}
      </button>
    </div>
  )
}
