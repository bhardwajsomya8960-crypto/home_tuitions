// Master data for forms and validation. Served to the frontend by GET /api/masters so the
// dropdowns and the server always agree. Values are stored; labels are for display.

const CLASSES = ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const BOARDS = ['CBSE', 'ICSE', 'State', 'IB', 'Other']
const SUBJECTS = [
  'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Telugu',
  'Sanskrit', 'Social Studies', 'History', 'Geography', 'Economics', 'Accountancy',
  'Computer Science', 'Phonics', 'All Subjects',
]
const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Urdu', 'Tamil', 'Kannada', 'Marathi']
const LEAD_MODES = ['home', 'online', 'hybrid']
const TUTOR_MODES = ['home', 'online']
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const SLOTS = [
  { value: 'early_morning', label: 'Early morning (6–8 AM)', start: '06:00', end: '08:00' },
  { value: 'morning', label: 'Morning (8 AM–12 PM)', start: '08:00', end: '12:00' },
  { value: 'afternoon', label: 'Afternoon (12–4 PM)', start: '12:00', end: '16:00' },
  { value: 'evening', label: 'Evening (4–7 PM)', start: '16:00', end: '19:00' },
  { value: 'night', label: 'Night (7–9 PM)', start: '19:00', end: '21:00' },
]
const BUDGET_RANGES = [
  { value: 'under_2000', label: 'Under ₹2,000 / month', min: 0, max: 2000 },
  { value: '2000_4000', label: '₹2,000 – ₹4,000 / month', min: 2000, max: 4000 },
  { value: '4000_6000', label: '₹4,000 – ₹6,000 / month', min: 4000, max: 6000 },
  { value: '6000_10000', label: '₹6,000 – ₹10,000 / month', min: 6000, max: 10000 },
  { value: 'over_10000', label: 'Above ₹10,000 / month', min: 10000, max: 25000 },
]
const URGENCY = [
  { value: 'immediate', label: 'Immediately' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
]
const RELATIONSHIPS = ['Parent', 'Guardian', 'Other']
const GENDERS = ['Female', 'Male', 'Other', 'Prefer not to say']
const QUALIFICATIONS = ['Diploma', 'Bachelor', 'B.Ed', 'Master', 'M.Ed', 'PhD', 'Other']
const LEAD_SOURCES = ['website', 'meta', 'google', 'whatsapp', 'referral', 'bda', 'other']
const REJECT_REASONS = [
  { value: 'too_far', label: 'Too far' },
  { value: 'schedule_conflict', label: 'Schedule conflict' },
  { value: 'subject_mismatch', label: 'Subject mismatch' },
  { value: 'fee_mismatch', label: 'Fee mismatch' },
  { value: 'already_occupied', label: 'Already occupied' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'temporarily_unavailable', label: 'Temporarily unavailable' },
  { value: 'other', label: 'Other' },
]
const LOST_REASONS = [
  { value: 'not_reachable', label: 'Not reachable' },
  { value: 'budget', label: 'Budget' },
  { value: 'chose_competitor', label: 'Chose another provider' },
  { value: 'no_tutor_available', label: 'No tutor available' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'duplicate', label: 'Duplicate enquiry' },
  { value: 'other', label: 'Other' },
]
const DOCUMENT_TYPES = [
  // multiple: the tutor can add several, each with a name. The profile photo is a single upload.
  { value: 'photo', label: 'Profile photo', required: true, multiple: false },
  { value: 'identity', label: 'Identity documents', required: true, multiple: true },
  { value: 'qualification', label: 'Qualifications', required: true, multiple: true },
  { value: 'experience', label: 'Experience proof', required: false, multiple: true },
]
const PAYMENT_METHODS = ['upi', 'bank_transfer', 'cash', 'cheque', 'other']
const PLANS = ['monthly', 'quarterly', 'one_time', 'custom']
const DEMO_OUTCOMES = [
  { value: 'interested', label: 'Interested — proceed' },
  { value: 'follow_up', label: 'Needs follow-up' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'tutor_change', label: 'Wants a different tutor' },
]

// Lead lifecycle (blueprint §12.1) and the transitions staff may make by hand. Matching,
// offers, demos and conversion move leads through their own endpoints.
const LEAD_STATUSES = [
  'new', 'contacted', 'qualified', 'matching', 'tutor_offered', 'tutor_accepted',
  'demo_scheduled', 'demo_completed', 'converted', 'on_hold', 'lost', 'cancelled',
]
const MANUAL_LEAD_TRANSITIONS = {
  new: ['contacted', 'qualified', 'on_hold', 'lost', 'cancelled'],
  contacted: ['qualified', 'on_hold', 'lost', 'cancelled'],
  qualified: ['on_hold', 'lost', 'cancelled'],
  matching: ['on_hold', 'lost', 'cancelled'],
  tutor_offered: ['on_hold', 'cancelled'],
  tutor_accepted: ['on_hold', 'cancelled'],
  demo_scheduled: ['on_hold', 'cancelled'],
  demo_completed: ['on_hold', 'lost', 'cancelled'],
  on_hold: ['contacted', 'qualified', 'lost', 'cancelled'],
  converted: [],
  lost: ['qualified'],
  cancelled: [],
}

function publicMasters() {
  return {
    classes: CLASSES, boards: BOARDS, subjects: SUBJECTS, languages: LANGUAGES,
    leadModes: LEAD_MODES, tutorModes: TUTOR_MODES, days: DAYS, slots: SLOTS,
    budgetRanges: BUDGET_RANGES.map(({ value, label }) => ({ value, label })),
    urgency: URGENCY, relationships: RELATIONSHIPS, genders: GENDERS, qualifications: QUALIFICATIONS,
    leadSources: LEAD_SOURCES, rejectReasons: REJECT_REASONS, lostReasons: LOST_REASONS,
    documentTypes: DOCUMENT_TYPES, paymentMethods: PAYMENT_METHODS, plans: PLANS,
    demoOutcomes: DEMO_OUTCOMES, leadStatuses: LEAD_STATUSES,
  }
}

const values = list => list.map(item => (typeof item === 'string' ? item : item.value))

module.exports = {
  CLASSES, BOARDS, SUBJECTS, LANGUAGES, LEAD_MODES, TUTOR_MODES, DAYS, SLOTS, BUDGET_RANGES,
  URGENCY, RELATIONSHIPS, GENDERS, QUALIFICATIONS, LEAD_SOURCES, REJECT_REASONS, LOST_REASONS,
  DOCUMENT_TYPES, PAYMENT_METHODS, PLANS, DEMO_OUTCOMES, LEAD_STATUSES, MANUAL_LEAD_TRANSITIONS,
  publicMasters, values,
}
