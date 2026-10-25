// Field specs for writes (see shared/validation.js). Unknown fields are rejected.
const M = require('../../shared/masters')

// The public website form. Only the phone number is required.
const publicEnquirySpec = {
  kind: { type: 'enum', required: true, allowed: ['parent', 'tutor'] },
  phone: { type: 'phone', required: true },
  name: { type: 'string', max: 80 },
  role: { type: 'enum', allowed: ['parent', 'student'] },
  level: { type: 'enum', allowed: M.values(M.ENQUIRY_LEVELS) },
  message: { type: 'string', max: 1000 },
  courseSlug: { type: 'string', max: 80 },
  // Hidden field that people never see; bots fill it in (see enquiry.service.js).
  website: { type: 'string', max: 200 },
}

// Staff recording an enquiry that came by phone or WhatsApp.
const staffEnquirySpec = {
  ...publicEnquirySpec,
  source: { type: 'enum', allowed: M.LEAD_SOURCES },
}
delete staffEnquirySpec.website

const enquiryUpdateSpec = {
  status: { type: 'enum', allowed: ['new', 'contacted', 'closed'] },
  note: { type: 'string', max: 1000 },
  closedReason: { type: 'string', max: 200 },
}

module.exports = { publicEnquirySpec, staffEnquirySpec, enquiryUpdateSpec }
