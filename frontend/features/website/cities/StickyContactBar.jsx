import { FaWhatsapp } from 'react-icons/fa'
import { FiPhone } from 'react-icons/fi'
import { CONTACT } from '@/features/website/contact'
import TrackedLink from './TrackedLink'

// WhatsApp + Call, pinned to the bottom of the screen on phones and tablets. It is part of the
// server-rendered page (no layout shift), and the page reserves its height with bottom padding
// (CityPage) so it never covers the footer. The floating WhatsApp button is hidden on these
// pages below the lg breakpoint, so the two never overlap (WhatsAppWidget).
export default function StickyContactBar({ whatsappHref, track }) {
  const btn = 'flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-ink text-base font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2'
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-ivory px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
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
