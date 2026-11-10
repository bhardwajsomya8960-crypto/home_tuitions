// "Looking for tuition in" / "I teach" choices on the callback form and in its email. Fixed
// here so the form does not depend on the backend API. Keep in step with ENQUIRY_LEVELS in
// backend/src/shared/masters.js, which the admin console uses.
export const ENQUIRY_LEVELS = [
  { value: 'school', label: 'Playgroup to Class 12' },
  { value: 'graduation', label: 'Graduation / college' },
  { value: 'competitive', label: 'Competitive exams' },
]
