# Implementation status against docs/UI.md

This maps each section of the blueprint (`docs/UI.md`) to what the code does now. **Built** means it works end to end on stored data and is covered by tests. **Partial** means part of the section is built; the gap is listed. **Not built** means nothing exists yet.

Verified by: `npm test` in `backend/` (123 tests) and `e2e/walkthrough.js` (browser walkthrough of the full journey, see `e2e/README.md`).

## Summary

| Blueprint area | Status | Notes |
|---|---|---|
| §4 Persistence | Partial | SQLite (development only), same pattern as the catalogue. Production needs a shared, backed-up datastore (PostgreSQL + PostGIS recommended in §4.2; Zoho Catalyst still not connected). |
| §6 Roles | Partial | Parent, tutor and a single admin role are enforced by signed tokens. Ops manager, BDA, finance, support, student and LMS admin roles do not exist yet; the admin role can do all staff actions. |
| §8 Sitemap | Partial | See "Screens" below. |
| §11.1 Parent form | Built | Every field in the dictionary except tutor gender "Other" options and the map-pin picker (device location is supported instead). |
| §11.2 Tutor form | Built | All fields. Bank/payout details are not collected (no payouts yet). Documents are uploaded after registration, from the dashboard. |
| §11.3 Staff-entered lead | Built | Reuses the parent account when the number is known. |
| §12.1 Lead lifecycle | Built | All 12 statuses. Manual transitions are restricted to an allowed list; matching, offers, demos and conversion move leads through their own actions. Every change is logged. |
| §12.2 Tutor verification | Built | pending → documents_submitted (automatic when required documents are uploaded) → under_review → verified (requires accepted photo, identity and qualification) → active; suspended and rejected need a reason. |
| §12.3 Offers | Built | Staff can also search tutors by name or phone in a lead and assign one directly (confirmed at once) or send them an offer; a tutor who fails the filters needs a recorded reason. |
| §12.3 Offers (automatic) | Built | Timed offers, auto-expiry and re-offer (30-second sweeper plus on every read), first acceptance wins, other open offers withdrawn, confirm/release. |
| §12.4 Demos | Built | Schedule (confirms the tutor), reschedule, complete, outcome (staff or parent), parent/tutor no-show with escalation after a configurable count, cancel. Parent can request a reschedule. |
| §12.5–12.6 Enrolments, classes | Built | Conversion creates the enrolment, first invoice and two weeks of sessions (kept topped up). Pause/resume/end. Tutor records attendance, notes and homework; parent confirms the class. |
| §12.7 Invoices | Partial | Pending / partial / paid / void with manual payments (UPI, bank, cash, cheque). No gateway, refunds, coupons, tax fields, receipts PDF or reminders. |
| §12.8–12.9 Tickets, payouts | Not built | |
| §13 Matching engine | Built | Hard filters (active, accepting leads, class, subject, mode, gender preference, slot overlap, tutor radius capped by the maximum), configurable distance bands, all seven weighted factors, explainable reasons, pincode fallback without coordinates, persisted match runs. Road distance (Distance Matrix) and PostGIS are not used; distance is straight-line. |
| §13.6 Privacy | Built | Tutors see pincode and distance only until the assignment is confirmed; parents see the tutor's contact only after confirmation. Tested in API and browser. |
| §14 Data model | Partial | Parents, students, tutors, documents, leads, lead events, match runs, assignments, demos, enrolments, class sessions, invoices, payments, reviews, settings, audit log. Not yet: users/roles table, call logs as a separate table (notes are lead events), tickets, payouts, notifications, LMS. |
| §15 API | Partial | See "API" below. |
| §16 Notifications | Not built | No SMS, WhatsApp or email is sent. Sign-in codes are written to the server log (and echoed in responses when `OTP_DEV_ECHO=true`). |
| §17 Settings | Partial | Weights (must total 100), distance bands, default and maximum radius, offer timeout, tutors offered at once, auto-confirm, demo length, no-show threshold. Master lists (subjects, classes…) are served from code, not editable in the admin yet. |
| §18 Dashboards | Partial | Admin overview (leads by stage, conversion rate, tutors, enrolments, collected/outstanding/overdue, operations counts) and operations queues. Geo, sales, learning and quality dashboards and the §18.2 reports are not built. |
| §19 Payments | Partial | Manual recording only (see §12.7). |
| §21 Online / LMS | Not built | Online leads are matched and scheduled like home leads; there is no video, recordings, assignments or tests. |
| §22 Ratings | Partial | Parents rate the tutor once after the demo and once during tuition; the average feeds matching. No complaints, SLA or quality score. |
| §23 Security | Partial | Signed role tokens, OTP hashing/attempt limits/cooldown, admin rate limiting, input validation that rejects unknown fields, uploads checked by file signature and size, KYC files served only to the owner or admin (admin views are audited), configurable CORS. Not yet: admin 2FA, encryption at rest, malware scanning, retention policy, per-route rate limits beyond login. |
| §24 Business rules | Built | Rules 1–10 are enforced and tested. Rule 1 is applied strictly: no tutor can opt into a wider radius yet. Rule 3: slots a tutor already teaches in are removed from their availability before matching. Duplicate enquiries (same parent, student and subject within 30 days) are flagged. |

## Screens

| Area | Built | Not yet |
|---|---|---|
| Public | Sign in (`/login`, parent or tutor by code), admin sign-in (`/admin/login`) | About, contact, terms, privacy pages |
| Parent | Register (4 steps with code, consent and review), dashboard: overview with "needs your attention", requests (timeline, tutor profile, demo, outcome, rating, cancel, reschedule request), classes (confirm), fees, students (add), profile, new request | Payments online, support tickets, calendar view |
| Tutor | Register (4 steps), dashboard: overview, lead offers (countdown, accept, decline with reason, not available, ask a question, history), classes (attendance), students, availability and profile editing, verification (uploads) | Earnings and payouts, support, calendar view, check-in/out |
| Admin | Overview, leads (search, filters, new lead), lead workspace (status, notes, location, matching with score breakdown, offers, confirm/release, demo actions, conversion), operations queues, tutors (document review, verify/activate/suspend/reject), finance (invoices, payments, enrolments), matching rules, audit log | Users and roles, masters editing, notification templates, reports, BDA/ops/finance-specific views |
| Student | — | All |

## API

All new routes validate input with the shared validator and return `{ error, code, details? }` on failure.

- `GET /api/masters`: form master data.
- `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`, `GET /api/auth/me/parent|tutor`.
- `POST /api/parents/register`; under `/api/parents/me` (parent token): `GET overview`, `GET classes`, `POST students`, `POST requests`, `POST requests/:id/cancel`, `POST requests/:id/review`, `POST demos/:id/outcome`, `POST demos/:id/reschedule-request`, `POST classes/:id/acknowledge`.
- `POST /api/tutors/register`; under `/api/tutors/me` (tutor token): `GET overview`, `PATCH /`, `POST documents` (multipart), `GET documents/:id/file`, `POST offers/:id/accept|reject|unavailable|request-info`, `POST classes/:id/attendance`.
- Under `/api/admin` (admin token): `GET dashboard`, `GET operations`, `GET|POST leads`, `GET leads/:id`, `POST leads/:id/status|notes|match|offers|demos|convert`, `PATCH leads/:id/location`, `POST assignments/:id/confirm|release`, `POST demos/:id/reschedule|complete|outcome|no-show|cancel`, `GET enrolments`, `POST enrolments/:id/status`, `GET|POST invoices`, `POST invoices/:id/payments|void`, `GET tutors`, `GET tutors/:id`, `POST tutors/:id/actions`, `POST documents/:id/review`, `GET documents/:id/file`, `GET|PUT settings`, `GET audit`.

Removed: the old stub routes `/api/leads`, `/api/demos`, `/api/enrolments`, `/api/classes`, `/api/payments`, the unauthenticated `GET /api/parents/:id` and `GET /api/tutors/:id`, and the in-memory store `config/catalyst.js`.

## Known limitations

- Lists in the admin load up to 100 records and filter in the browser. Server-side paging exists in the API but the UI does not page beyond 100 yet.
- One-time codes and the admin login limiter are kept in memory, so they reset on restart and do not work across several server processes.
- Class sessions are generated two weeks ahead when someone opens a dashboard; there is no background scheduler for them.
- Times are shown in India time (IST); there is no per-user time zone.
- Brand: the blueprint uses "homeTuitions", the landing page, sign-in pages and portals say "Home Tuition". This needs a decision before launch.
