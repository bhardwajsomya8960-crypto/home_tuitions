// Parent portal API paths (backend: src/api/parent/routes.js).
export const PARENT_API = {
  register: '/api/parents/register',
  overview: '/api/parents/me/overview',
  classes: '/api/parents/me/classes',
  acknowledgeClass: id => `/api/parents/me/classes/${id}/acknowledge`,
  students: '/api/parents/me/students',
  requests: '/api/parents/me/requests',
  // action: cancel | review
  requestAction: (id, action) => `/api/parents/me/requests/${id}/${action}`,
  // action: outcome | reschedule-request
  demoAction: (id, action) => `/api/parents/me/demos/${id}/${action}`,
}
