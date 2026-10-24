#!/usr/bin/env node
// Seeds dummy test accounts into the database for local development and testing.
//
// Usage:
//   node scripts/seed-test-users.js
//
// This script creates:
//   - 2 parents (with students and leads)
//   - 3 tutors (with verified status)
//   - Matching assignments and demo data
//
// All test phones use the prefix 9900 so they are easy to spot.

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') })

const { openDatabase } = require('../src/config/database')
const { createOperationsRepository } = require('../src/repositories/operationsRepository')
const crypto = require('crypto')

const db = openDatabase()
const repo = createOperationsRepository(db)
const uuid = () => crypto.randomUUID()
const now = new Date().toISOString()

console.log('🌱 Seeding test users...\n')

// ── Helper ──────────────────────────────────────────────────────────
function seed(table, record) {
  try {
    return repo.insert(table, record)
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      console.log(`   ⏭  Skipping duplicate in ${table}: ${record.name || record.id}`)
      return record
    }
    throw err
  }
}

// ── Parents ─────────────────────────────────────────────────────────
const parent1Id = uuid()
const parent2Id = uuid()

const parent1 = seed('parents', {
  id: parent1Id,
  name: 'Rajesh Kumar',
  phone: '9900100001',
  email: 'rajesh.test@example.com',
  relationship: 'Parent',
  address: 'Plot 42, Jubilee Hills, Hyderabad',
  pincode: '500033',
  latitude: 17.4325,
  longitude: 78.4073,
  consent: { terms: true, communication: true, location: true, recordedAt: now },
  status: 'active',
  createdAt: now,
  updatedAt: now,
})
console.log('✅ Parent 1: Rajesh Kumar (9900100001)')

const parent2 = seed('parents', {
  id: parent2Id,
  name: 'Priya Sharma',
  phone: '9900100002',
  email: 'priya.test@example.com',
  relationship: 'Parent',
  address: '15-A, Banjara Hills Road No. 12, Hyderabad',
  pincode: '500034',
  latitude: 17.4156,
  longitude: 78.4347,
  consent: { terms: true, communication: true, location: true, recordedAt: now },
  status: 'active',
  createdAt: now,
  updatedAt: now,
})
console.log('✅ Parent 2: Priya Sharma (9900100002)')

// ── Students ────────────────────────────────────────────────────────
const student1Id = uuid()
const student2Id = uuid()
const student3Id = uuid()

seed('students', {
  id: student1Id, parentId: parent1Id, name: 'Aarav Kumar',
  class: '8', board: 'CBSE', school: 'Delhi Public School',
  subjects: ['Mathematics', 'Science'], createdAt: now, updatedAt: now,
})
console.log('   📚 Student: Aarav Kumar (Class 8 CBSE)')

seed('students', {
  id: student2Id, parentId: parent1Id, name: 'Ananya Kumar',
  class: '10', board: 'CBSE', school: 'Delhi Public School',
  subjects: ['Mathematics', 'Physics', 'Chemistry'], createdAt: now, updatedAt: now,
})
console.log('   📚 Student: Ananya Kumar (Class 10 CBSE)')

seed('students', {
  id: student3Id, parentId: parent2Id, name: 'Rohan Sharma',
  class: '6', board: 'ICSE', school: 'Meridian International',
  subjects: ['English', 'Mathematics', 'Science'], createdAt: now, updatedAt: now,
})
console.log('   📚 Student: Rohan Sharma (Class 6 ICSE)')

// ── Leads ───────────────────────────────────────────────────────────
const lead1Id = uuid()
const lead2Id = uuid()
const lead3Id = uuid()

seed('leads', {
  id: lead1Id, code: 'HT-L-000001', parentId: parent1Id, studentId: student1Id,
  source: 'website', mode: 'home',
  subjects: ['Mathematics', 'Science'], class: '8', board: 'CBSE',
  preferredDays: ['mon', 'wed', 'fri'], preferredSlots: ['evening'],
  prefLanguages: ['English', 'Hindi'], budgetRange: '4000_6000',
  address: 'Plot 42, Jubilee Hills, Hyderabad', pincode: '500033',
  latitude: 17.4325, longitude: 78.4073, geocodeSource: 'device',
  status: 'qualified', noTutorFound: false,
  createdAt: now, updatedAt: now,
})
console.log('   📋 Lead HT-L-000001 (Aarav, Maths+Science, qualified)')

seed('leads', {
  id: lead2Id, code: 'HT-L-000002', parentId: parent1Id, studentId: student2Id,
  source: 'website', mode: 'online',
  subjects: ['Physics', 'Chemistry'], class: '10', board: 'CBSE',
  preferredDays: ['tue', 'thu', 'sat'], preferredSlots: ['evening', 'night'],
  prefLanguages: ['English'], budgetRange: '6000_10000',
  status: 'new', noTutorFound: false,
  createdAt: now, updatedAt: now,
})
console.log('   📋 Lead HT-L-000002 (Ananya, Physics+Chem, new)')

seed('leads', {
  id: lead3Id, code: 'HT-L-000003', parentId: parent2Id, studentId: student3Id,
  source: 'referral', mode: 'home',
  subjects: ['English', 'Mathematics'], class: '6', board: 'ICSE',
  preferredDays: ['mon', 'tue', 'wed', 'thu', 'fri'], preferredSlots: ['afternoon'],
  prefLanguages: ['English'], budgetRange: '2000_4000',
  address: '15-A, Banjara Hills Road No. 12, Hyderabad', pincode: '500034',
  latitude: 17.4156, longitude: 78.4347, geocodeSource: 'device',
  status: 'contacted', noTutorFound: false,
  createdAt: now, updatedAt: now,
})
console.log('   📋 Lead HT-L-000003 (Rohan, English+Maths, contacted)')

// ── Tutors ──────────────────────────────────────────────────────────
const tutor1Id = uuid()
const tutor2Id = uuid()
const tutor3Id = uuid()

seed('tutors', {
  id: tutor1Id,
  name: 'Rahul Verma',
  phone: '9900200001',
  email: 'rahul.tutor@example.com',
  gender: 'Male',
  qualification: 'Master',
  college: 'Osmania University',
  experienceYears: 6,
  address: '3-6-245, Himayatnagar, Hyderabad',
  pincode: '500029',
  latitude: 17.3950,
  longitude: 78.4867,
  subjects: ['Mathematics', 'Physics', 'Science'],
  classes: ['6', '7', '8', '9', '10'],
  boards: ['CBSE', 'ICSE', 'State'],
  languages: ['English', 'Hindi', 'Telugu'],
  modes: ['home', 'online'],
  availability: { mon: ['evening'], tue: ['evening'], wed: ['evening'], thu: ['evening'], fri: ['evening'], sat: ['morning', 'afternoon'] },
  serviceRadiusKm: 10,
  feeMin: 3000,
  feeMax: 8000,
  bio: 'Experienced maths and science tutor with 6 years of teaching experience. IIT aspirant background with strong command over CBSE and ICSE curricula.',
  teachingMethod: 'Concept-based learning with regular practice tests and doubt clearing sessions.',
  achievements: 'Helped 50+ students score above 90% in board exams. 3 students cleared JEE Mains.',
  demoAvailable: true,
  acceptingLeads: true,
  ratingCount: 0,
  status: 'verified',
  consent: { terms: true, communication: true, recordedAt: now },
  createdAt: now,
  updatedAt: now,
})
console.log('✅ Tutor 1: Rahul Verma (9900200001) — verified')

seed('tutors', {
  id: tutor2Id,
  name: 'Sneha Reddy',
  phone: '9900200002',
  email: 'sneha.tutor@example.com',
  gender: 'Female',
  qualification: 'B.Ed',
  college: 'University of Hyderabad',
  experienceYears: 4,
  address: '8-2-120, Road No. 3, Banjara Hills, Hyderabad',
  pincode: '500034',
  latitude: 17.4210,
  longitude: 78.4410,
  subjects: ['English', 'Hindi', 'Social Studies', 'History', 'Geography'],
  classes: ['1', '2', '3', '4', '5', '6', '7', '8'],
  boards: ['CBSE', 'ICSE'],
  languages: ['English', 'Hindi', 'Telugu'],
  modes: ['home', 'online'],
  availability: { mon: ['morning', 'afternoon'], tue: ['morning', 'afternoon'], wed: ['morning'], thu: ['morning', 'afternoon'], fri: ['morning', 'afternoon'] },
  serviceRadiusKm: 8,
  feeMin: 2000,
  feeMax: 5000,
  bio: 'B.Ed certified primary and middle school teacher. Specializing in language arts and social sciences with interactive storytelling methods.',
  demoAvailable: true,
  acceptingLeads: true,
  ratingCount: 0,
  status: 'verified',
  consent: { terms: true, communication: true, recordedAt: now },
  createdAt: now,
  updatedAt: now,
})
console.log('✅ Tutor 2: Sneha Reddy (9900200002) — verified')

seed('tutors', {
  id: tutor3Id,
  name: 'Vikram Iyer',
  phone: '9900200003',
  email: 'vikram.tutor@example.com',
  gender: 'Male',
  qualification: 'PhD',
  college: 'IIT Hyderabad',
  experienceYears: 8,
  address: '1-10-50, Begumpet, Hyderabad',
  pincode: '500016',
  latitude: 17.4430,
  longitude: 78.4680,
  subjects: ['Mathematics', 'Physics', 'Chemistry'],
  classes: ['9', '10', '11', '12'],
  boards: ['CBSE', 'IB'],
  languages: ['English', 'Hindi'],
  modes: ['home', 'online'],
  availability: { mon: ['evening', 'night'], wed: ['evening', 'night'], fri: ['evening', 'night'], sat: ['morning', 'afternoon', 'evening'], sun: ['morning', 'afternoon'] },
  serviceRadiusKm: 12,
  feeMin: 5000,
  feeMax: 12000,
  bio: 'PhD in Physics from IIT Hyderabad. 8 years of tutoring experience for competitive exams including JEE, NEET and Olympiads. Board exam specialist for classes 11-12.',
  demoAvailable: true,
  acceptingLeads: true,
  ratingCount: 0,
  status: 'verified',
  consent: { terms: true, communication: true, recordedAt: now },
  createdAt: now,
  updatedAt: now,
})
console.log('✅ Tutor 3: Vikram Iyer (9900200003) — verified')

// ── Lead Events (audit trail) ──────────────────────────────────────
const events = [
  { id: uuid(), leadId: lead1Id, type: 'created', actor: `parent:${parent1Id}`, details: 'Enquiry received via website', createdAt: now },
  { id: uuid(), leadId: lead1Id, type: 'status_change', actor: 'admin', details: JSON.stringify({ from: 'new', to: 'contacted' }), createdAt: now },
  { id: uuid(), leadId: lead1Id, type: 'status_change', actor: 'admin', details: JSON.stringify({ from: 'contacted', to: 'qualified' }), createdAt: now },
  { id: uuid(), leadId: lead2Id, type: 'created', actor: `parent:${parent1Id}`, details: 'Enquiry received via website', createdAt: now },
  { id: uuid(), leadId: lead3Id, type: 'created', actor: `parent:${parent2Id}`, details: 'Enquiry received via referral', createdAt: now },
  { id: uuid(), leadId: lead3Id, type: 'status_change', actor: 'admin', details: JSON.stringify({ from: 'new', to: 'contacted' }), createdAt: now },
]
for (const evt of events) {
  seed('lead_events', evt)
}
console.log('   📝 Lead events seeded')

console.log('\n────────────────────────────────────────────')
console.log('🎉 Test data seeded successfully!')
console.log('────────────────────────────────────────────\n')

console.log('🔑 TEST CREDENTIALS')
console.log('────────────────────────────────────────────')
console.log('')
console.log('ADMIN (email + password):')
console.log('  Email:    admin@hometuitions.com')
console.log('  Password: Admin@12345678')
console.log('  Login:    POST /api/admin/auth/login')
console.log('')
console.log('PARENTS (OTP login — code printed to server console):')
console.log('  Rajesh Kumar:  9900100001')
console.log('  Priya Sharma:  9900100002')
console.log('')
console.log('TUTORS (OTP login — code printed to server console):')
console.log('  Rahul Verma:   9900200001')
console.log('  Sneha Reddy:   9900200002')
console.log('  Vikram Iyer:   9900200003')
console.log('')
console.log('TIP: Set OTP_DEV_ECHO=true in .env.local to')
console.log('     get the OTP code in the API response.')
console.log('────────────────────────────────────────────\n')

db.close()
