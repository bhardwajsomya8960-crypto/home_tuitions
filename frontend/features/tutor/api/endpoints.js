// Tutor portal API paths (backend: src/api/tutor/routes.js).
export const TUTOR_API = {
  register: '/api/tutors/register',
  profile: '/api/tutors/me',
  overview: '/api/tutors/me/overview',
  documents: '/api/tutors/me/documents',
  document: id => `/api/tutors/me/documents/${id}`,
  documentFile: id => `/api/tutors/me/documents/${id}/file`,
  // action: accept | reject | unavailable | request-info
  offerAction: (id, action) => `/api/tutors/me/offers/${id}/${action}`,
  attendance: sessionId => `/api/tutors/me/classes/${sessionId}/attendance`,
}
