# home tution: Project Overview

home tution is a platform that connects parents with tutors for home and online tuition. It covers three audiences: parents who need tuition, tutors who teach, and internal administrators who run the business.

This document describes the project as it is in the repository today. Where something is planned but not built, it says so.

---

## 1. Current status

| Area | State |
|------|-------|
| Landing page | Built |
| Parent registration (multi-step form) | Built, calls the backend |
| Tutor registration (multi-step form) | Built, calls the backend |
| Parent dashboard | Built with sample data, no API calls |
| Tutor dashboard | Built with sample data, no API calls |
| Admin dashboard | Built with sample data, no API calls |
| Offline page and installable PWA (frontend) | Built |
| Backend API routes | Built as scaffolding |
| Backend data storage | In memory only, not connected to Zoho Catalyst |
| Authentication | OTP and token logic built, no login UI |
| Matching engine | Built, not connected to the database |
| Google Calendar, email, KYC upload, payments | Partly built or not started |
| Automated tests | None written |

The "Currently not connected" items are the most important limitation: the dashboards show fixed sample data, and the backend loses all data when it restarts.

---

## 2. Repository layout

```
home/
├── frontend/              Next.js 14 web app (landing page, portals, admin, PWA)
│   ├── app/
│   │   ├── page.jsx                  Landing page
│   │   ├── layout.jsx                Root layout, manifest and theme metadata
│   │   ├── offline/                  Offline fallback page
│   │   ├── parent/register/          Parent registration form
│   │   ├── parent/dashboard/         Parent portal
│   │   ├── tutor/register/           Tutor registration form
│   │   ├── tutor/dashboard/          Tutor portal
│   │   └── admin/dashboard/          Internal admin dashboard
│   ├── components/
│   │   ├── shell/                    App shell: sidebar, navbar, mobile header, bottom tabs, update/offline banners
│   │   └── data/                     Shared DataTable, Pagination, RecordCard
│   ├── middleware.js                 Sends / to each portal based on the port (dev setup)
│   ├── next.config.js                Next.js config and PWA caching rules
│   └── public/                       Manifest, icons, generated service worker (build output)
├── backend/               Node.js + Express API
│   └── src/
│       ├── index.js                  App entry point, mounts all routes under /api
│       ├── config/catalyst.js        In-memory data store standing in for Zoho Catalyst
│       ├── routes/                   One file per area (auth, parents, tutors, leads, demos, classes, enrolments, payments, admin)
│       └── services/                 authService, geoService, matchingService, emailService
├── docs/                  (empty)
├── docker-compose.yml     Single-stack Docker setup
├── docker-compose.multi.yml  Five services on separate ports
├── start-multi-local.sh   Starts backend and three frontend ports locally
├── start-multi-docker.sh  Starts the multi-port Docker setup
├── .env.example / .env.ports  Configuration templates
└── README.md, SETUP.md, DOCKER.md, RUN_MULTI_PORT.md, PROGRESS.md  Older guides
```

---

## 3. Users and what they can do

### Parent
- Registers and submits a tuition enquiry: parent details, student details, tuition requirements (location, mode, days, time, budget), then a review step.
- The dashboard shows students, tutors, schedule, invoices and requests. Today this is sample data.

### Tutor
- Registers in two steps: personal and academic details, then location and availability.
- The dashboard shows lead offers (accept or reject), students, schedule and earnings. Today this is sample data.

### Internal admin
- Dashboard with KPIs (total leads, conversions, tutors, revenue), a lead table, a tutor list with verification, a finance view, and a matching configuration view. Today this is sample data.

---

## 4. Frontend

**Stack:** Next.js 14 (App Router), React 18, Tailwind CSS 3, Framer Motion, react-icons, axios.

### Layout by screen size
- **Desktop (1024px and up):** a 240px sidebar (icons only between 768px and 1023px), a 68px navbar with breadcrumb and user, and a fluid content area.
- **Phone (below 768px):** a compact header with the screen title, and bottom tabs with a "More" sheet when there are more than five sections.
- **Tables:** on desktop they render as tables with search, filters, sortable columns and pagination (10, 20 or 50 rows per page). On phones the same rows render as cards.

### PWA
- Installable as a standalone app (`manifest.webmanifest`), with placeholder "ht" icons.
- Built with `@ducanh2912/next-pwa` in production only. The dev server is not cached.
- Caching rules:
  - API calls and page navigations are never cached.
  - Next.js static JS and CSS, fonts and images are cached.
- Offline: a precached `/offline` page is shown when a navigation fails.
- Updates: a new version waits, and the user accepts it through an "Update" banner.

### Local multi-port setup (development)
- `middleware.js` reads the port in the Host header. On ports 3001, 3002 and 3003 the root path redirects to the tutor, parent and admin dashboards. Port 3000 shows the landing page.
- Each dev server uses its own build folder (`.next-<port>`), set through `NEXT_DIST_DIR`. Sharing one `.next` folder caused intermittent 404s.

---

## 5. Backend

**Stack:** Node.js 16+, Express 4, helmet, cors, dotenv, axios, nodemailer, googleapis, bcryptjs, jsonwebtoken, uuid. Dev tooling: nodemon, jest (no tests yet).

### Entry point
`backend/src/index.js` applies helmet, cors and JSON parsing, mounts the routers below, and has a general error handler.

### API areas

| Mount path | File | Endpoints (method and path) |
|---|---|---|
| `/api/auth` | `auth.js` | `POST /send-otp`, `POST /verify-otp`, `POST /verify-token` |
| `/api/parents` | `parents.js` | `POST /register`, `GET /:parentId`, `GET /:parentId/students`, `GET /:parentId/leads` |
| `/api/tutors` | `tutors.js` | `POST /register`, `GET /:tutorId`, `POST /:tutorId/availability`, `GET /:tutorId/leads`, `POST /:tutorId/leads/:leadId/accept`, `POST /:tutorId/leads/:leadId/reject`, `GET /:tutorId/classes`, `POST /:tutorId/kyc` |
| `/api/leads` | `leads.js` | `GET /`, `GET /:leadId`, `POST /:leadId/match`, `GET /:leadId/tutors` |
| `/api/demos` | `demos.js` | `POST /`, `GET /:demoId`, `PATCH /:demoId`, `POST /:demoId/reschedule` |
| `/api/classes` | `classes.js` | `POST /`, `POST /:classId/attendance`, `GET /:classId`, `GET /enrolment/:enrolmentId` |
| `/api/enrolments` | `enrolments.js` | `POST /`, `GET /:enrolmentId`, `GET /student/:studentId`, `PATCH /:enrolmentId` |
| `/api/payments` | `payments.js` | `POST /invoices`, `GET /invoices/:invoiceId`, `POST /payments`, `GET /payments/:paymentId`, `GET /parent/:parentId/invoices`, `GET /history/:studentId` |
| `/api/admin` | `admin.js` | `GET /dashboard`, `GET /users`, `GET /tutors`, `POST /tutors/:tutorId/verify`, `GET /config/matching`, `POST /config/matching/weights`, `GET /leads/pipeline`, `GET /finance`, `GET /masters` |

### Data
- `config/catalyst.js` holds all records in JavaScript arrays (parents, students, tutors, leads, demos, enrolments, classes, invoices, payments). The file is named for Zoho Catalyst, but nothing is sent there yet.
- OTPs are kept in a `Map` and are printed to the console instead of being sent by SMS or email.
- Session tokens are kept in a `Map`.

### Matching
- `services/geoService.js` calculates distance with the Haversine formula.
- `services/matchingService.js` ranks tutors using weighted scores. The README lists the default weights as: distance 30, subject fit 25, availability 15, experience 10, quality 10, acceptance reliability 5, fee fit 5.
- Hard filters: verification, subject, and distance.

### Lead lifecycle (as described in README)
New → Contacted → Qualified → Matching → Offered → Accepted → Demo → Converted.
Tutors have a 10-minute window to accept an offer (README).

---

## 6. Running the project

### Requirements
- Node.js 16 or later (Node 18 is used by the frontend Docker image).
- npm.

### Local, single stack
```bash
cd backend && npm install && npm run dev      # API on port 5000
cd frontend && npm install && npm run dev     # web app on port 3000
```

### Local, all portals
```bash
./start-multi-local.sh
```
This starts the backend on 5000 and the frontend on 3000, 3001, 3002 and 3003.

### Production build (frontend)
```bash
cd frontend && npm run build && npm start
```

### Docker
```bash
docker-compose up                                  # single stack
docker-compose -f docker-compose.multi.yml up      # multi-port
```

### Environment variables
Templates are in `.env.example` and `.env.ports`. Variables named in the templates include `JWT_SECRET`, `CATALYST_PROJECT_ID`, `CATALYST_API_KEY`, `ZOHO_MAIL_*`, `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, and the port variables (`BACKEND_PORT`, `FRONTEND_PORT`, `TUTOR_PORTAL_PORT`, `PARENT_PORTAL_PORT`, `ADMIN_PORTAL_PORT`).

---

## 7. Known gaps and risks

1. **No real data.** The three dashboards use hard-coded sample data. The registration forms are the only screens that call the API.
2. **No persistence.** Backend data is lost on restart. Catalyst is not connected.
3. **No login UI.** The OTP and token code exists, but no screen uses it, and the dashboards have no access control.
4. **OTP is logged, not sent.** Codes appear in the server console.
5. **Sensitive data and the offline cache.** The PWA is designed not to cache account data. The dashboards show sample data only, so this has not been tested against real records.
6. **Email, Google Calendar, KYC upload and payments** are incomplete or planned.
7. **No automated tests.** The Jest setup exists but there are no tests.
8. **Lint is not configured.** `next lint` prompts for setup.
9. **Dependency audit.** `npm audit` reports vulnerabilities in the frontend and backend dependency trees. They have not been reviewed.
10. **Older docs are out of date.** `PROGRESS.md` marks the dashboards as "0%" and the README lists the admin as a future module, both of which no longer match the code.

---

## 8. Planned next steps (from PROGRESS.md and README)

- Connect the dashboards and registration forms to the real API.
- Replace the in-memory store with Zoho Catalyst datastore tables, and add migrations.
- Add login screens for parents and tutors, and access control for admin routes.
- Send OTPs by SMS or email.
- Add validation, error handling, audit logging and rate limiting to the API.
- Add KYC document upload and Google Calendar integration for demos.
- Add tests at unit, API and end-to-end levels.
- Move table pagination and filtering to the server once the list endpoints are in use.

Phase 2 items listed in PROGRESS.md include WhatsApp integration, a payment gateway (Razorpay or PayU), analytics, a React Native app, and an LMS.
