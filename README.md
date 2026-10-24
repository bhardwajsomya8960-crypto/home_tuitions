# home tution — Home & Online Tuition Platform

A complete platform connecting parents with verified tutors for home and online tuition services.

## Project Structure

```
home-tution/
├── frontend/              # Next.js web application
│   ├── app/
│   │   ├── page.jsx      # Landing page (beautiful, animated)
│   │   ├── parent/       # Parent portal (registration, dashboard, leads)
│   │   ├── tutor/        # Tutor portal (registration, leads, classes)
│   │   └── admin/        # Admin dashboard (internal operations)
│   ├── components/       # Reusable React components
│   ├── styles/          # CSS and styling
│   ├── lib/             # Utility functions
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── backend/               # Node.js Express API
│   ├── src/
│   │   ├── config/      # Catalyst DB configuration
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic (auth, geo, matching, email)
│   │   ├── models/      # Data models (TBD)
│   │   ├── middleware/  # Express middleware (TBD)
│   │   └── index.js     # Express app entry point
│   └── package.json
├── admin/                # React admin dashboard (future)
├── .env.example          # Environment variables template
└── README.md
```

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS, Framer Motion
- **Admin:** React (TBD)
- **Backend:** Node.js, Express.js
- **Database:** Zoho Catalyst Datastore
- **Geo-matching:** Google Maps API, Google Places API
- **Calendar:** Google Calendar API
- **Email:** Zoho Mail + Nodemailer
- **Authentication:** OTP-based (Catalyst)

## Features (MVP)

### Landing Page
- Beautiful, animated hero section
- Feature highlights
- How-it-works explainer
- Call-to-action buttons
- SEO-optimized
- Responsive mobile design

### Parent Portal
- Registration & tuition enquiry form
- Lead status tracking
- Tutor profile view
- Demo scheduling & reminders
- Class calendar & attendance
- Invoice & payment tracking
- Ratings & feedback

### Tutor Portal
- Registration & document upload (KYC)
- Availability management
- Lead offers with 10-minute accept window
- Assigned students & classes
- Class notes & attendance
- Earnings dashboard
- Support tickets

### Internal Admin
- Dashboard with KPIs (leads, conversions, revenue, tutors)
- Lead pipeline management
- Tutor verification (KYC)
- Matching configuration
  - Editable weights (distance, subject fit, availability, experience, quality, acceptance reliability, fee fit)
  - Service radius, offer timeout settings
- Finance dashboard
- Reports & analytics

### Core Logic
- **Geo-matching:** Haversine distance + configurable scoring algorithm
- **Lead lifecycle:** New → Contacted → Qualified → Matching → Offered → Accepted → Demo → Converted
- **Tutor matching:** 30% Distance + 25% Subject/Class/Board + 15% Availability + 10% Experience + 10% Quality + 5% Acceptance Reliability + 5% Fee Fit
- **Email notifications:** Via Zoho Mail + Nodemailer
- **Manual payments:** Invoice creation + payment tracking (no gateway in MVP)
- **Audit logging:** All critical actions logged

## Setup Instructions

### Prerequisites
- Node.js 16+
- npm or yarn
- Zoho Catalyst account (with datastore & email)
- Google Maps & Places API keys
- Google Calendar API credentials

### 1. Clone & Setup Environment

```bash
cd home-tution

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
# - Catalyst project ID and API key
# - Zoho Mail credentials
# - Google Maps API key
# - Google Calendar OAuth credentials
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
# API runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# App runs on http://localhost:3000
```

### 4. Access the Application

- **Landing Page:** http://localhost:3000
- **Parent Register:** http://localhost:3000/parent/register
- **Tutor Register:** http://localhost:3000/tutor/register
- **Admin Dashboard:** http://localhost:3000/admin/dashboard
- **API Docs:** http://localhost:5000/health (health check)

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` — Send OTP
- `POST /api/auth/verify-otp` — Verify OTP and login
- `POST /api/auth/verify-token` — Verify JWT token

### Parents
- `POST /api/parents/register` — Parent registration
- `GET /api/parents/:parentId` — Get parent profile
- `GET /api/parents/:parentId/students` — List parent's students
- `GET /api/parents/:parentId/leads` — List parent's leads

### Tutors
- `POST /api/tutors/register` — Tutor registration
- `GET /api/tutors/:tutorId` — Get tutor profile
- `POST /api/tutors/:tutorId/availability` — Update availability
- `GET /api/tutors/:tutorId/leads` — Get assigned leads
- `POST /api/tutors/:tutorId/leads/:leadId/accept` — Accept lead
- `POST /api/tutors/:tutorId/leads/:leadId/reject` — Reject lead

### Leads
- `GET /api/leads` — List all leads (admin/BDA)
- `GET /api/leads/:leadId` — Get lead details
- `POST /api/leads/:leadId/match` — Run matching algorithm
- `GET /api/leads/:leadId/tutors` — Get ranked tutors for lead

### Demos
- `POST /api/demos` — Schedule demo
- `GET /api/demos/:demoId` — Get demo details
- `PATCH /api/demos/:demoId` — Update demo status
- `POST /api/demos/:demoId/reschedule` — Reschedule demo

### Classes
- `POST /api/classes` — Create class session
- `POST /api/classes/:classId/attendance` — Record attendance
- `GET /api/classes/:classId` — Get class details

### Enrolments
- `POST /api/enrolments` — Convert lead to enrolment
- `GET /api/enrolments/:enrolmentId` — Get enrolment details
- `PATCH /api/enrolments/:enrolmentId` — Update enrolment status

### Payments
- `POST /api/payments/invoices` — Create invoice
- `GET /api/payments/invoices/:invoiceId` — Get invoice
- `POST /api/payments/payments` — Record payment (manual)
- `GET /api/payments/parent/:parentId/invoices` — Get parent's invoices

### Admin
- `GET /api/admin/dashboard` — Dashboard stats
- `GET /api/admin/users` — List users
- `GET /api/admin/tutors` — List tutors
- `POST /api/admin/tutors/:tutorId/verify` — Verify tutor
- `GET /api/admin/config/matching` — Get matching config
- `POST /api/admin/config/matching/weights` — Update weights
- `GET /api/admin/leads/pipeline` — Get lead pipeline
- `GET /api/admin/finance` — Finance dashboard

## Matching Algorithm

The geo-matching engine uses a configurable scoring system:

```
Match Score = 
  Distance (30%) +
  Subject/Class/Board Fit (25%) +
  Availability (15%) +
  Experience (10%) +
  Quality/Rating (10%) +
  Acceptance Reliability (5%) +
  Fee Fit (5%)
```

**Hard Filters (must pass):**
- Tutor verification status: `verified` or `active`
- Subject match: tutor teaches requested subject
- Distance: within configured radius (default 8 km, max 12 km)

**Tutor Ranking:**
1. Validate parent requirement
2. Geocode address using Google Places API
3. Find verified, active tutors within radius
4. Filter by subject, class, board, mode, schedule
5. Calculate match score for each tutor
6. Sort by score (highest first)
7. Offer to top tutor with 10-minute acceptance timeout
8. Auto-move to next if rejected/expired

## Deployment (Phase 2)

- Docker containerization
- CI/CD pipeline (GitHub Actions)
- Production database migration
- Third-party integrations (payment, SMS, WhatsApp)
- Advanced caching (Redis)
- Load balancing & monitoring

## Known Limitations (MVP)

- No WhatsApp automation (Phase 2)
- No payment gateway integration (manual tracking only)
- No video integration for live classes (structure only)
- No advanced analytics beyond basic dashboards
- No multi-language UI
- No mobile apps (responsive web only)

## Contributing

1. Create a feature branch
2. Make changes
3. Test locally
4. Create a pull request

## License

Private — home tution

## Support

For issues or questions, contact: support@hometution.com

---

**Version:** 1.0.0 (MVP)  
**Last Updated:** October 2024
# edTech
