# home tution: Project Overview

home tution is a platform that connects parents with tutors for home and online tuition. It covers three audiences: parents who need tuition, tutors who teach, and internal staff who run the business.

This document describes the project as it is in the repository today. The full product specification is `docs/UI.md`; `docs/IMPLEMENTATION_STATUS.md` maps each part of it to what is built.

---

## 1. Current status

| Area | State |
|------|-------|
| Landing page, course catalogue pages | Built |
| Parent and tutor sign-in by one-time code | Built (codes are logged, not sent: no SMS provider yet) |
| Parent registration and new requests | Built, stored, with consent and duplicate detection |
| Tutor registration, availability, KYC uploads | Built |
| Admin sign-in and console | Built: leads, matching, offers, demos, conversion, tutors, finance, settings, audit log |
| Matching engine | Built on stored tutors, with admin-editable rules |
| Timed tutor offers with automatic hand-over | Built |
| Demos, enrolments, classes, attendance | Built |
| Invoices and manual payments | Built; no payment gateway |
| Parent and tutor dashboards | Built on real data |
| Data storage | MongoDB (Atlas in production); tutor documents in S3 |
| WhatsApp, SMS, email sending | Not built |
| Online classes (video, LMS), support tickets, payouts, reports | Not built |
| Automated tests | 131 backend tests (against MongoDB), plus a browser walkthrough in `e2e/` |

---

## 2. Repository layout

```
├── frontend/      app/ (routes only) · features/{website,auth,parent,tutor,admin} · shared/{ui,data,shell,brand,lib}
├── backend/src/   api/{website,parent,tutor,admin} (routes + controllers) · modules/<area> (models, services,
│                  validation) · db/ (MongoDB connection, repository) · services/ (S3 storage, geocoding, email)
│                  · shared/ · jobs/
├── backend/test/  node:test suites (each file uses its own temporary MongoDB database)
├── deploy/aws/    production on EC2 + MongoDB Atlas + S3
├── e2e/           browser walkthrough (Playwright)
└── docs/          UI.md (specification), ARCHITECTURE.md, status, guides
```

Details and conventions: `docs/ARCHITECTURE.md`.

---

## 3. What each user can do

### Parent
- Start an enquiry in four steps: their details (mobile verified by code), student, tuition needs (mode, address and optional device location, days, times, budget, start, urgency, tutor preferences, notes) and a review with consent.
- Sign in later with a code. The dashboard shows what needs attention, each request's progress, the tutor's profile once a tutor accepts and their contact once confirmed, demo details, a choice of outcome after the demo, ratings, classes with the tutor's notes (and a button to confirm each class), invoices, and students. Parents can raise more requests, add students, cancel a request and ask to move a demo.

### Tutor
- Register in four steps, including weekly hours (a switch per day with one or more time ranges), fees and a profile, then upload a photo plus any number of named identity documents, qualifications and experience proofs. Holidays and time off can be added from the dashboard.
- Receive lead offers with a countdown. An offer shows class, board, subjects, mode, pincode, distance, schedule, budget and notes, but not the parent's name, number or address. The tutor can accept, decline with a reason, say they are not available, or ask a question.
- See confirmed students with parent contact, demos, classes (record attendance, notes and homework), and edit availability, subjects, fees and whether they want new leads.

### Staff (admin)
- Overview of leads by stage, conversion, tutors, enrolments and money collected or outstanding.
- Leads: search and filter, add a lead for a caller, change status (with reasons for lost leads), add notes, fix a location, run matching and see each tutor's score breakdown and reasons, send offers (next in line or a chosen tutor), confirm or release a tutor, schedule, move, complete or cancel demos, record no-shows and outcomes, and convert to an enrolment.
- Operations queues: accepted offers awaiting confirmation, leads with no tutor, open offers with countdowns, tutor questions, escalations and upcoming demos.
- Tutors: review each document, then verify, activate, suspend or reject.
- Finance: invoices (record payments, void), enrolments (pause, resume, end, new invoice).
- Matching rules and the audit log.

---

## 4. How a lead moves

`new → contacted → qualified → matching → tutor_offered → tutor_accepted → demo_scheduled → demo_completed → converted`, with `on_hold`, `lost` and `cancelled` as exits.

- Matching filters tutors first (active, taking leads, teaches the class and at least one subject, offers the mode, free at a requested time that is not already booked, within their own travel radius and the maximum radius), then ranks them by distance band, subject/board fit, availability, experience, rating, acceptance history and fee fit. Weights and bands are set by staff and must total 100%.
- An offer stays open for the configured time (10 minutes by default). When it expires or is declined, the next tutor is offered automatically. If nobody is left, the lead goes to the "no tutor" queue.
- The first tutor to accept wins. Staff then confirm (or turn on automatic confirmation), which shares contact details both ways.
- A demo must be completed before conversion. Converting creates the enrolment, the first invoice and two weeks of classes.

---

## 5. Running the project

```bash
docker compose up -d mongo                    # MongoDB (or set MONGODB_URI to Atlas)
cd backend && npm install && npm run dev      # API on port 5000
cd frontend && npm install && npm run dev     # web app on port 3000
```

Production: `deploy/aws/README.md`.

Set at least `JWT_SECRET`, and `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_JWT_SECRET` for the staff console (see `.env.example`). For local testing without SMS, set `OTP_DEV_ECHO=true` so the sign-in code is shown on screen. Never enable it in production.

Optional: `GOOGLE_MAPS_API_KEY` geocodes addresses. Without it, parents can share their device location, staff can enter coordinates, and matching falls back to tutors in the same pincode.

Tests: `cd backend && npm test`. Browser walkthrough: see `e2e/README.md`.

---

## 6. Known gaps and risks

1. **Hosting not yet live.** The AWS setup (EC2 + MongoDB Atlas + S3) is written and tested locally in `deploy/aws/`, but not yet run on a real AWS account.
2. **No messages are sent.** Codes, offers, reminders and receipts are not delivered by SMS, WhatsApp or email.
3. **One staff role.** Every staff member uses the single admin account; there are no BDA, operations or finance roles yet.
4. **In-memory limits.** One-time codes and login rate limits reset on restart and are per process.
5. **No payment gateway, payouts, tickets, LMS or reports** (see `docs/IMPLEMENTATION_STATUS.md`).
6. **Brand name**: the app uses "Home & Online Tutor Hub"; the specification still says "homeTuitions".
7. **Older guides**: `docs/PROGRESS.md` predates this work and describes the earlier scaffolding.
