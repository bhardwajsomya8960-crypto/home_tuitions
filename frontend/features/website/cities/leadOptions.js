// Choices on the city lead form. Shared by the form (labels) and the email route (validation
// and the wording in the email), so both always agree. Plain data only.
export const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: `class-${i + 1}`, label: `Class ${i + 1}` }))

export const SUBJECT_OPTIONS = [
  'All subjects', 'Maths', 'Science', 'English', 'Hindi', 'Social Science',
  'Physics', 'Chemistry', 'Biology', 'Accountancy', 'Economics', 'Business Studies',
  'Computer / Coding', 'Spoken English',
].map(label => ({ value: label.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''), label }))

export const MODE_OPTIONS = [
  { value: 'home', label: 'Home tuition' },
  { value: 'online', label: 'Online' },
]

export const TIME_OPTIONS = [
  { value: 'evening', label: 'Evening' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'flexible', label: 'Flexible' },
]

export const labelOf = (options, value) => options.find(o => o.value === value)?.label || ''
