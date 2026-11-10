// The course catalogue shown on the website: learning categories and their courses.
// Kept in the website itself so the Courses and Categories pages work without the backend API
// (the site is deployed on Vercel on its own). Generated from the backend list
// (backend/src/modules/catalogue/catalogue.seed.js, the same records as in the database).
//
// To change what visitors see, edit this file:
//   - status: "published" shows it, "draft" hides it. A course shows only if its category is published.
//   - displayOrder sorts them (lowest first); featured marks highlights.
//   - categoryId on a course is the slug of its category.
//   - learningModes: "home" and/or "online".

export const CATEGORIES = [
  {
    "id": "early-learning",
    "slug": "early-learning",
    "name": "Early Learning",
    "shortDescription": "Preschool and foundational skills for the youngest learners.",
    "description": "",
    "iconKey": "early-learning",
    "accentColour": "#CDEDD8",
    "coverImageUrl": "",
    "displayOrder": 1,
    "featured": true,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "school-tuition",
    "slug": "school-tuition",
    "name": "School Tuition",
    "shortDescription": "Support for school subjects from Class 1 to Class 12.",
    "description": "",
    "iconKey": "school",
    "accentColour": "#F7E96B",
    "coverImageUrl": "",
    "displayOrder": 2,
    "featured": true,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "competitive-exams",
    "slug": "competitive-exams",
    "name": "Competitive Exams",
    "shortDescription": "Preparation for entrance and competitive examinations.",
    "description": "",
    "iconKey": "exam",
    "accentColour": "#E7DEFF",
    "coverImageUrl": "",
    "displayOrder": 3,
    "featured": true,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "college-graduation",
    "slug": "college-graduation",
    "name": "College & Graduation",
    "shortDescription": "Undergraduate and postgraduate subjects.",
    "description": "",
    "iconKey": "college",
    "accentColour": "#FFAB91",
    "coverImageUrl": "",
    "displayOrder": 4,
    "featured": false,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "computer-coding",
    "slug": "computer-coding",
    "name": "Computer & Coding",
    "shortDescription": "Programming, computer science and technology subjects.",
    "description": "",
    "iconKey": "code",
    "accentColour": "#CDEDD8",
    "coverImageUrl": "",
    "displayOrder": 5,
    "featured": true,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "skills-languages",
    "slug": "skills-languages",
    "name": "Skills & Languages",
    "shortDescription": "Languages and practical skills for everyday and professional use.",
    "description": "",
    "iconKey": "language",
    "accentColour": "#F7E96B",
    "coverImageUrl": "",
    "displayOrder": 6,
    "featured": false,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  }
]

export const COURSES = [
  {
    "id": "early-phonics-and-reading",
    "slug": "early-phonics-and-reading",
    "name": "Phonics and Reading",
    "categoryId": "early-learning",
    "shortDescription": "Letter sounds, reading practice and early vocabulary.",
    "description": "",
    "levelLabel": "Foundational",
    "applicableFor": "Early learners",
    "subjects": [
      "Phonics",
      "Reading"
    ],
    "learningObjectives": [],
    "prerequisites": [],
    "targetAudience": "",
    "learningModes": [
      "home",
      "online"
    ],
    "coverImageUrl": "",
    "displayOrder": 1,
    "featured": false,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "class-3-mathematics",
    "slug": "class-3-mathematics",
    "name": "Class 3 Mathematics",
    "categoryId": "school-tuition",
    "shortDescription": "Numbers, operations and word problems for Class 3.",
    "description": "",
    "levelLabel": "Class 3",
    "applicableFor": "Class 3",
    "subjects": [
      "Mathematics"
    ],
    "learningObjectives": [],
    "prerequisites": [],
    "targetAudience": "",
    "learningModes": [
      "home",
      "online"
    ],
    "coverImageUrl": "",
    "displayOrder": 1,
    "featured": false,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "class-8-science",
    "slug": "class-8-science",
    "name": "Class 8 Science",
    "categoryId": "school-tuition",
    "shortDescription": "Core Class 8 science topics with worked examples.",
    "description": "",
    "levelLabel": "Class 8",
    "applicableFor": "Class 8",
    "subjects": [
      "Science"
    ],
    "learningObjectives": [],
    "prerequisites": [],
    "targetAudience": "",
    "learningModes": [
      "home",
      "online"
    ],
    "coverImageUrl": "",
    "displayOrder": 2,
    "featured": false,
    "status": "draft",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "class-10-mathematics",
    "slug": "class-10-mathematics",
    "name": "Class 10 Mathematics",
    "categoryId": "school-tuition",
    "shortDescription": "Algebra, geometry and statistics practice for Class 10.",
    "description": "",
    "levelLabel": "Class 10",
    "applicableFor": "Class 10",
    "subjects": [
      "Mathematics"
    ],
    "learningObjectives": [],
    "prerequisites": [],
    "targetAudience": "",
    "learningModes": [
      "home",
      "online"
    ],
    "coverImageUrl": "",
    "displayOrder": 3,
    "featured": true,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "class-12-physics",
    "slug": "class-12-physics",
    "name": "Class 12 Physics",
    "categoryId": "school-tuition",
    "shortDescription": "Senior secondary physics with problem-solving practice.",
    "description": "",
    "levelLabel": "Class 12",
    "applicableFor": "Class 12 (Science stream)",
    "subjects": [
      "Physics"
    ],
    "learningObjectives": [],
    "prerequisites": [],
    "targetAudience": "",
    "learningModes": [
      "home",
      "online"
    ],
    "coverImageUrl": "",
    "displayOrder": 4,
    "featured": true,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "neet-ug-preparation",
    "slug": "neet-ug-preparation",
    "name": "NEET UG Preparation",
    "categoryId": "competitive-exams",
    "shortDescription": "Subject-wise preparation for NEET UG.",
    "description": "",
    "levelLabel": "Exam preparation",
    "applicableFor": "NEET UG",
    "subjects": [
      "Physics",
      "Chemistry",
      "Biology"
    ],
    "learningObjectives": [],
    "prerequisites": [],
    "targetAudience": "",
    "learningModes": [
      "home",
      "online"
    ],
    "coverImageUrl": "",
    "displayOrder": 1,
    "featured": true,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "jee-main-preparation",
    "slug": "jee-main-preparation",
    "name": "JEE Main Preparation",
    "categoryId": "competitive-exams",
    "shortDescription": "Subject-wise preparation for JEE Main.",
    "description": "",
    "levelLabel": "Exam preparation",
    "applicableFor": "JEE Main",
    "subjects": [
      "Mathematics",
      "Physics",
      "Chemistry"
    ],
    "learningObjectives": [],
    "prerequisites": [],
    "targetAudience": "",
    "learningModes": [
      "home",
      "online"
    ],
    "coverImageUrl": "",
    "displayOrder": 2,
    "featured": true,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "bca-programming-fundamentals",
    "slug": "bca-programming-fundamentals",
    "name": "BCA Programming Fundamentals",
    "categoryId": "computer-coding",
    "shortDescription": "Programming basics for BCA coursework.",
    "description": "",
    "levelLabel": "Undergraduate",
    "applicableFor": "BCA",
    "subjects": [
      "C",
      "Programming Fundamentals"
    ],
    "learningObjectives": [],
    "prerequisites": [],
    "targetAudience": "",
    "learningModes": [
      "online"
    ],
    "coverImageUrl": "",
    "displayOrder": 1,
    "featured": true,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "btech-data-structures",
    "slug": "btech-data-structures",
    "name": "B.Tech Data Structures",
    "categoryId": "computer-coding",
    "shortDescription": "Arrays, linked lists, trees and graphs with practice problems.",
    "description": "",
    "levelLabel": "Undergraduate",
    "applicableFor": "B.Tech",
    "subjects": [
      "Data Structures and Algorithms"
    ],
    "learningObjectives": [],
    "prerequisites": [],
    "targetAudience": "",
    "learningModes": [
      "home",
      "online"
    ],
    "coverImageUrl": "",
    "displayOrder": 2,
    "featured": false,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "python-programming",
    "slug": "python-programming",
    "name": "Python Programming",
    "categoryId": "computer-coding",
    "shortDescription": "Python from first programs to small projects.",
    "description": "",
    "levelLabel": "Skill course",
    "applicableFor": "Beginners and students",
    "subjects": [
      "Python"
    ],
    "learningObjectives": [],
    "prerequisites": [],
    "targetAudience": "",
    "learningModes": [
      "online"
    ],
    "coverImageUrl": "",
    "displayOrder": 3,
    "featured": true,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  },
  {
    "id": "spoken-english",
    "slug": "spoken-english",
    "name": "Spoken English",
    "categoryId": "skills-languages",
    "shortDescription": "Conversation practice and pronunciation.",
    "description": "",
    "levelLabel": "Skill course",
    "applicableFor": "Learners of all ages",
    "subjects": [
      "English speaking"
    ],
    "learningObjectives": [],
    "prerequisites": [],
    "targetAudience": "",
    "learningModes": [
      "home",
      "online"
    ],
    "coverImageUrl": "",
    "displayOrder": 1,
    "featured": false,
    "status": "published",
    "seoTitle": "",
    "seoDescription": ""
  }
]
