// Sample catalogue content for development and demonstration only.
// Descriptions are generic. No fees, durations, tutors, ratings or outcomes are stated.
// Seeded records are marked source: 'sample' so they can be identified and removed.

const categories = [
  { slug: 'early-learning', name: 'Early Learning', shortDescription: 'Preschool and foundational skills for the youngest learners.', displayOrder: 1, featured: true, iconKey: 'early-learning', accentColour: '#CDEDD8' },
  { slug: 'school-tuition', name: 'School Tuition', shortDescription: 'Support for school subjects from Class 1 to Class 12.', displayOrder: 2, featured: true, iconKey: 'school', accentColour: '#F7E96B' },
  { slug: 'competitive-exams', name: 'Competitive Exams', shortDescription: 'Preparation for entrance and competitive examinations.', displayOrder: 3, featured: true, iconKey: 'exam', accentColour: '#E7DEFF' },
  { slug: 'college-graduation', name: 'College & Graduation', shortDescription: 'Undergraduate and postgraduate subjects.', displayOrder: 4, featured: false, iconKey: 'college', accentColour: '#FFAB91' },
  { slug: 'computer-coding', name: 'Computer & Coding', shortDescription: 'Programming, computer science and technology subjects.', displayOrder: 5, featured: true, iconKey: 'code', accentColour: '#CDEDD8' },
  { slug: 'skills-languages', name: 'Skills & Languages', shortDescription: 'Languages and practical skills for everyday and professional use.', displayOrder: 6, featured: false, iconKey: 'language', accentColour: '#F7E96B' },
];

const courses = [
  { slug: 'early-phonics-and-reading', name: 'Phonics and Reading', category: 'early-learning', levelLabel: 'Foundational', applicableFor: 'Early learners', subjects: ['Phonics', 'Reading'], learningModes: ['home', 'online'], shortDescription: 'Letter sounds, reading practice and early vocabulary.', featured: false, displayOrder: 1, status: 'published' },
  { slug: 'class-3-mathematics', name: 'Class 3 Mathematics', category: 'school-tuition', levelLabel: 'Class 3', applicableFor: 'Class 3', subjects: ['Mathematics'], learningModes: ['home', 'online'], shortDescription: 'Numbers, operations and word problems for Class 3.', featured: false, displayOrder: 1, status: 'published' },
  { slug: 'class-8-science', name: 'Class 8 Science', category: 'school-tuition', levelLabel: 'Class 8', applicableFor: 'Class 8', subjects: ['Science'], learningModes: ['home', 'online'], shortDescription: 'Core Class 8 science topics with worked examples.', featured: false, displayOrder: 2, status: 'draft' },
  { slug: 'class-10-mathematics', name: 'Class 10 Mathematics', category: 'school-tuition', levelLabel: 'Class 10', applicableFor: 'Class 10', subjects: ['Mathematics'], learningModes: ['home', 'online'], shortDescription: 'Algebra, geometry and statistics practice for Class 10.', featured: true, displayOrder: 3, status: 'published' },
  { slug: 'class-12-physics', name: 'Class 12 Physics', category: 'school-tuition', levelLabel: 'Class 12', applicableFor: 'Class 12 (Science stream)', subjects: ['Physics'], learningModes: ['home', 'online'], shortDescription: 'Senior secondary physics with problem-solving practice.', featured: true, displayOrder: 4, status: 'published' },
  { slug: 'neet-ug-preparation', name: 'NEET UG Preparation', category: 'competitive-exams', levelLabel: 'Exam preparation', applicableFor: 'NEET UG', subjects: ['Physics', 'Chemistry', 'Biology'], learningModes: ['home', 'online'], shortDescription: 'Subject-wise preparation for NEET UG.', featured: true, displayOrder: 1, status: 'published' },
  { slug: 'jee-main-preparation', name: 'JEE Main Preparation', category: 'competitive-exams', levelLabel: 'Exam preparation', applicableFor: 'JEE Main', subjects: ['Mathematics', 'Physics', 'Chemistry'], learningModes: ['home', 'online'], shortDescription: 'Subject-wise preparation for JEE Main.', featured: true, displayOrder: 2, status: 'published' },
  { slug: 'bca-programming-fundamentals', name: 'BCA Programming Fundamentals', category: 'computer-coding', levelLabel: 'Undergraduate', applicableFor: 'BCA', subjects: ['C', 'Programming Fundamentals'], learningModes: ['online'], shortDescription: 'Programming basics for BCA coursework.', featured: true, displayOrder: 1, status: 'published' },
  { slug: 'btech-data-structures', name: 'B.Tech Data Structures', category: 'computer-coding', levelLabel: 'Undergraduate', applicableFor: 'B.Tech', subjects: ['Data Structures and Algorithms'], learningModes: ['home', 'online'], shortDescription: 'Arrays, linked lists, trees and graphs with practice problems.', featured: false, displayOrder: 2, status: 'published' },
  { slug: 'python-programming', name: 'Python Programming', category: 'computer-coding', levelLabel: 'Skill course', applicableFor: 'Beginners and students', subjects: ['Python'], learningModes: ['online'], shortDescription: 'Python from first programs to small projects.', featured: true, displayOrder: 3, status: 'published' },
  { slug: 'spoken-english', name: 'Spoken English', category: 'skills-languages', levelLabel: 'Skill course', applicableFor: 'Learners of all ages', subjects: ['English speaking'], learningModes: ['home', 'online'], shortDescription: 'Conversation practice and pronunciation.', featured: false, displayOrder: 1, status: 'published' },
];

module.exports = { categories, courses };
