'use client'

import { ApiError } from '@/shared/lib/api'
import { getUtm } from '@/shared/lib/utm'

// Sends the callback form to the website's own /api/notify/enquiry route, which emails it to
// the team's Gmail. It does not use the backend API, so the form works on a frontend-only
// deployment (Vercel). Requests are not stored in the admin console.
// Every request also carries the page it was sent from and the visit's UTM parameters.
const NOTIFY_PATH = '/api/notify/enquiry'

export async function sendEnquiry(body) {
  const payload = { source_page: window.location.pathname, ...getUtm(), ...body }
  let res
  try {
    res = await fetch(NOTIFY_PATH, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
  } catch {
    throw new ApiError(0, { error: 'Could not reach the server. Check your connection and try again.', code: 'NETWORK' })
  }
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, json)
  return json
}
