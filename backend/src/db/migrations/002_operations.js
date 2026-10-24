// Core operations data: parents, students, tutors, leads, matching, demos, enrolments,
// classes, billing, settings and the audit trail. List columns are stored as JSON text.
module.exports = `
CREATE TABLE parents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  relationship TEXT NOT NULL,
  address TEXT,
  pincode TEXT,
  latitude REAL,
  longitude REAL,
  consent TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE students (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES parents(id),
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  board TEXT NOT NULL,
  school TEXT,
  subjects TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE tutors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  gender TEXT NOT NULL,
  dob TEXT,
  qualification TEXT NOT NULL,
  college TEXT,
  experience_years INTEGER NOT NULL DEFAULT 0,
  subjects TEXT NOT NULL DEFAULT '[]',
  classes TEXT NOT NULL DEFAULT '[]',
  boards TEXT NOT NULL DEFAULT '[]',
  languages TEXT NOT NULL DEFAULT '[]',
  modes TEXT NOT NULL DEFAULT '[]',
  service_radius_km REAL NOT NULL DEFAULT 8,
  address TEXT NOT NULL,
  pincode TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  availability TEXT NOT NULL DEFAULT '[]',
  fee_min INTEGER,
  fee_max INTEGER,
  bio TEXT NOT NULL,
  teaching_method TEXT,
  achievements TEXT,
  demo_available INTEGER NOT NULL DEFAULT 1,
  accepting_leads INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'documents_submitted', 'under_review', 'verified', 'active', 'suspended', 'rejected')),
  status_notes TEXT,
  rating_avg REAL,
  rating_count INTEGER NOT NULL DEFAULT 0,
  consent TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE tutor_documents (
  id TEXT PRIMARY KEY,
  tutor_id TEXT NOT NULL REFERENCES tutors(id),
  type TEXT NOT NULL CHECK (type IN ('photo', 'identity', 'qualification', 'experience')),
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected')),
  reject_reason TEXT,
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);

CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  parent_id TEXT NOT NULL REFERENCES parents(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  source TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('home', 'online', 'hybrid')),
  subjects TEXT NOT NULL DEFAULT '[]',
  class TEXT NOT NULL,
  board TEXT NOT NULL,
  preferred_days TEXT NOT NULL DEFAULT '[]',
  preferred_slots TEXT NOT NULL DEFAULT '[]',
  pref_gender TEXT,
  pref_languages TEXT NOT NULL DEFAULT '[]',
  budget_range TEXT,
  start_date TEXT,
  urgency TEXT,
  special_requirements TEXT,
  address TEXT,
  pincode TEXT,
  latitude REAL,
  longitude REAL,
  geocode_source TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  no_tutor_found INTEGER NOT NULL DEFAULT 0,
  lost_reason TEXT,
  course_id TEXT,
  course_slug TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE lead_events (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  actor TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE match_runs (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  settings TEXT NOT NULL,
  results TEXT NOT NULL,
  excluded_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Assignment history is never deleted (business rule 7).
CREATE TABLE assignments (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  tutor_id TEXT NOT NULL REFERENCES tutors(id),
  match_run_id TEXT REFERENCES match_runs(id),
  rank INTEGER,
  score INTEGER NOT NULL,
  distance_km REAL,
  factors TEXT NOT NULL DEFAULT '{}',
  reasons TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('offered', 'accepted', 'rejected', 'expired', 'unavailable', 'withdrawn', 'confirmed', 'released')),
  offered_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  responded_at TEXT,
  reject_reason TEXT,
  reject_comment TEXT,
  info_request TEXT,
  confirmed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE demos (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  tutor_id TEXT NOT NULL REFERENCES tutors(id),
  scheduled_at TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  mode TEXT NOT NULL,
  location_note TEXT,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show_parent', 'no_show_tutor')),
  outcome TEXT CHECK (outcome IN ('interested', 'follow_up', 'not_interested', 'tutor_change')),
  notes TEXT,
  reschedule_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE enrolments (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  parent_id TEXT NOT NULL REFERENCES parents(id),
  tutor_id TEXT NOT NULL REFERENCES tutors(id),
  subjects TEXT NOT NULL DEFAULT '[]',
  mode TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('one_time', 'monthly', 'quarterly', 'custom')),
  fee_amount INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  schedule TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE class_sessions (
  id TEXT PRIMARY KEY,
  enrolment_id TEXT NOT NULL REFERENCES enrolments(id),
  scheduled_date TEXT NOT NULL,
  slot TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  tutor_present INTEGER,
  student_present INTEGER,
  notes TEXT,
  homework TEXT,
  parent_ack_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (enrolment_id, scheduled_date, slot)
);

CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  enrolment_id TEXT NOT NULL REFERENCES enrolments(id),
  parent_id TEXT NOT NULL REFERENCES parents(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  period_label TEXT NOT NULL,
  amount INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'partial', 'paid', 'void')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  amount INTEGER NOT NULL,
  method TEXT NOT NULL,
  reference TEXT,
  paid_on TEXT NOT NULL,
  notes TEXT,
  recorded_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES parents(id),
  tutor_id TEXT NOT NULL REFERENCES tutors(id),
  lead_id TEXT NOT NULL REFERENCES leads(id),
  stage TEXT NOT NULL CHECK (stage IN ('demo', 'ongoing')),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (parent_id, lead_id, stage)
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

-- Append-only record of every write made through the operations service.
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_students_parent ON students(parent_id);
CREATE INDEX idx_tutors_status ON tutors(status);
CREATE INDEX idx_leads_status ON leads(status, created_at);
CREATE INDEX idx_leads_parent ON leads(parent_id);
CREATE INDEX idx_lead_events_lead ON lead_events(lead_id, created_at);
CREATE INDEX idx_assignments_lead ON assignments(lead_id, status);
CREATE INDEX idx_assignments_tutor ON assignments(tutor_id, status);
CREATE INDEX idx_assignments_expiry ON assignments(status, expires_at);
CREATE INDEX idx_demos_lead ON demos(lead_id);
CREATE INDEX idx_enrolments_tutor ON enrolments(tutor_id);
CREATE INDEX idx_enrolments_parent ON enrolments(parent_id);
CREATE INDEX idx_sessions_enrolment ON class_sessions(enrolment_id, scheduled_date);
CREATE INDEX idx_invoices_parent ON invoices(parent_id);
CREATE INDEX idx_audit_entity ON audit_log(entity, entity_id);
`
