// Choices on the homepage callback form, also used to word the email. Fixed here so the form
// does not depend on the backend API.

// "I teach" (tutor tab): broad groups. Same values as ENQUIRY_LEVELS in
// backend/src/shared/masters.js, which the admin console uses.
export const ENQUIRY_LEVELS = [
  { value: 'school', label: 'Playgroup to Class 12' },
  { value: 'graduation', label: 'Graduation / college' },
  { value: 'competitive', label: 'Competitive exams' },
]

// "Looking for tuition in" (parent / student tab): one choice per class, so the team knows
// the exact class before calling.
export const TUITION_LEVELS = [
  { value: 'playgroup', label: 'Playgroup' },
  { value: 'nursery', label: 'Nursery' },
  { value: 'lkg', label: 'LKG' },
  { value: 'ukg', label: 'UKG' },
  ...Array.from({ length: 12 }, (_, i) => ({ value: `class-${i + 1}`, label: `Class ${i + 1}` })),
  { value: 'graduation', label: 'Graduation / college' },
  { value: 'competitive', label: 'Competitive exams' },
]

export const levelLabel = value => [...TUITION_LEVELS, ...ENQUIRY_LEVELS].find(l => l.value === value)?.label || ''
