// Staff API paths (backend: src/api/admin/routes.js). Change a URL here, not in components.
export const ADMIN_API = {
  login: '/api/admin/auth/login',
  dashboard: '/api/admin/dashboard',
  operations: '/api/admin/operations',
  settings: '/api/admin/settings',
  audit: page => `/api/admin/audit?limit=50&page=${page}`,

  enquiries: '/api/admin/enquiries',
  enquiriesList: '/api/admin/enquiries?limit=100',
  enquiry: id => `/api/admin/enquiries/${id}`,

  parents: '/api/admin/parents',
  parentsList: '/api/admin/parents?limit=100',
  parent: id => `/api/admin/parents/${id}`,
  parentStudents: id => `/api/admin/parents/${id}/students`,
  parentLeads: id => `/api/admin/parents/${id}/leads`,

  leads: '/api/admin/leads',
  leadsList: '/api/admin/leads?limit=100',
  lead: id => `/api/admin/leads/${id}`,
  // action: status | notes | location | match | offers | assign | demos | convert
  leadAction: (id, action) => `/api/admin/leads/${id}/${action}`,
  tutorSearch: (leadId, q) => `/api/admin/leads/${leadId}/tutor-search?q=${encodeURIComponent(q)}`,
  // action: confirm | release
  assignmentAction: (id, action) => `/api/admin/assignments/${id}/${action}`,
  // action: reschedule | complete | outcome | no-show | cancel
  demoAction: (id, action) => `/api/admin/demos/${id}/${action}`,

  enrolmentsList: '/api/admin/enrolments?limit=100',
  enrolmentStatus: id => `/api/admin/enrolments/${id}/status`,
  invoices: '/api/admin/invoices',
  invoicesList: '/api/admin/invoices?limit=100',
  // action: payments | void
  invoiceAction: (id, action) => `/api/admin/invoices/${id}/${action}`,

  tutors: '/api/admin/tutors',
  tutorsList: '/api/admin/tutors?limit=100',
  tutorDocuments: id => `/api/admin/tutors/${id}/documents`,
  tutor: id => `/api/admin/tutors/${id}`,
  tutorActions: id => `/api/admin/tutors/${id}/actions`,
  documentReview: id => `/api/admin/documents/${id}/review`,
  documentFile: id => `/api/admin/documents/${id}/file`,
}
