'use client'

import { trackContact } from '@/shared/lib/tracking'

// A link that records a Contact event (Meta Pixel / GA4) when tapped, e.g. WhatsApp or Call.
// `track` holds the event's custom parameters: { city, area, method }.
export default function TrackedLink({ track, onClick, children, ...props }) {
  return (
    <a {...props} onClick={e => { trackContact(track); onClick?.(e) }}>
      {children}
    </a>
  )
}
