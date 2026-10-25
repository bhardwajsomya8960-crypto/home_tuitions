// Display helpers shared by the portals. Stored values stay as the API sends them.

export const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }
export const SLOT_SHORT = { early_morning: '6–8 AM', morning: '8 AM–12 PM', afternoon: '12–4 PM', evening: '4–7 PM', night: '7–9 PM' }
export const MODE_LABELS = { home: 'Home', online: 'Online', hybrid: 'Hybrid' }

export const LEAD_STATUS = {
  new: { label: 'New', tone: 'gray' },
  contacted: { label: 'Contacted', tone: 'sky' },
  qualified: { label: 'Qualified', tone: 'yellow' },
  matching: { label: 'Matching', tone: 'blue' },
  tutor_offered: { label: 'Tutor offered', tone: 'indigo' },
  tutor_accepted: { label: 'Tutor accepted', tone: 'teal' },
  demo_scheduled: { label: 'Demo scheduled', tone: 'purple' },
  demo_completed: { label: 'Demo completed', tone: 'violet' },
  converted: { label: 'Converted', tone: 'green' },
  on_hold: { label: 'On hold', tone: 'amber' },
  lost: { label: 'Lost', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
}

export const TUTOR_STATUS = {
  pending: { label: 'Documents needed', tone: 'amber' },
  documents_submitted: { label: 'Documents submitted', tone: 'sky' },
  under_review: { label: 'Under review', tone: 'blue' },
  verified: { label: 'Verified', tone: 'teal' },
  active: { label: 'Active', tone: 'green' },
  suspended: { label: 'Suspended', tone: 'red' },
  rejected: { label: 'Rejected', tone: 'red' },
}

export const OFFER_STATUS = {
  offered: { label: 'Awaiting reply', tone: 'indigo' },
  accepted: { label: 'Accepted', tone: 'teal' },
  confirmed: { label: 'Confirmed', tone: 'green' },
  rejected: { label: 'Declined', tone: 'red' },
  unavailable: { label: 'Not available', tone: 'amber' },
  expired: { label: 'Expired', tone: 'slate' },
  withdrawn: { label: 'Withdrawn', tone: 'slate' },
  released: { label: 'Released', tone: 'slate' },
}

export const DEMO_STATUS = {
  scheduled: { label: 'Scheduled', tone: 'purple' },
  completed: { label: 'Completed', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
  no_show_parent: { label: 'Parent missed', tone: 'amber' },
  no_show_tutor: { label: 'Tutor missed', tone: 'red' },
}

export const INVOICE_STATUS = {
  pending: { label: 'Due', tone: 'amber' },
  partial: { label: 'Part paid', tone: 'sky' },
  paid: { label: 'Paid', tone: 'green' },
  void: { label: 'Void', tone: 'slate' },
}

export const SESSION_STATUS = {
  scheduled: { label: 'Scheduled', tone: 'blue' },
  completed: { label: 'Completed', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'slate' },
}

export const DOC_STATUS = {
  submitted: { label: 'Waiting for review', tone: 'sky' },
  accepted: { label: 'Accepted', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
}

export const rupees = n => (n === null || n === undefined ? '—' : `₹${Number(n).toLocaleString('en-IN')}`)

const IST = { timeZone: 'Asia/Kolkata' }
export const formatDate = iso => (iso ? new Date(iso.length === 10 ? `${iso}T00:00:00+05:30` : iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...IST }) : '—')
export const formatDateTime = iso => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', ...IST }) : '—')
export const weekday = iso => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', ...IST })

export const daysText = days => (days || []).map(d => DAY_LABELS[d] || d).join(', ')
export const slotsText = slots => (slots || []).map(s => SLOT_SHORT[s] || s).join(', ')
export const scheduleText = schedule => (schedule || []).map(s => `${DAY_LABELS[s.day]} ${SLOT_SHORT[s.slot]}`).join(' · ')
export const DAY_NAMES = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }
// '16:30' → '4:30 PM'
export const timeLabel = time => {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`
}
// Tutor hours [{ day, start, end }] → 'Mon 4 PM–7 PM · Sat 9 AM–1 PM'
export const hoursText = hours => (hours || []).map(h => `${DAY_LABELS[h.day]} ${timeLabel(h.start)}–${timeLabel(h.end)}`).join(' · ')
export const classLabel = c => (/^\d+$/.test(String(c)) ? `Class ${c}` : c)

// Converts a datetime-local input value (IST wall clock) to an ISO string.
export const istLocalToIso = value => (value ? new Date(`${value}:00+05:30`).toISOString() : '')
