# Setup Guide — home tution MVP

This guide walks you through setting up the MVP locally for development.

## Prerequisites

Before starting, ensure you have:
- Node.js 16+ and npm (or yarn)
- Git
- Text editor (VS Code recommended)
- Accounts for:
  - **Zoho Catalyst** (for database)
  - **Zoho Mail** (for email)
  - **Google Cloud** (for Maps, Places, Calendar APIs)

## Step 1: Clone Repository & Install Dependencies

```bash
# Navigate to project
cd /Users/somyabhardwaj/Desktop/home

# Backend setup
cd backend
npm install

# Frontend setup (in another terminal)
cd frontend
npm install
```

## Step 2: Configure Environment Variables

### 2.1 Get Zoho Catalyst Credentials

1. Go to [Zoho Catalyst Console](https://catalyst.zoho.com)
2. Create a new project or use existing
3. Go to **Settings > API Keys**
4. Copy:
   - Project ID
   - API Key (you may need to generate one)

### 2.2 Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Google Places API**
   - **Google Calendar API**
4. Go to **Credentials > Create Credentials > API Key**
5. Copy the API key

### 2.3 Get Zoho Mail Credentials

1. Go to [Zoho Mail](https://mail.zoho.in)
2. Generate an **App Password** for SMTP access:
   - Settings > Security > Generate App Password
   - Copy the password

### 2.4 Create .env File

```bash
cd /Users/somyabhardwaj/Desktop/home
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Backend
PORT=5000
JWT_SECRET=your-random-secret-key-min-32-chars

# Catalyst
CATALYST_PROJECT_ID=your_project_id
CATALYST_API_KEY=your_api_key

# Zoho Mail
ZOHO_MAIL_USER=your-email@zoho.in
ZOHO_MAIL_PASSWORD=your-app-password
ZOHO_MAIL_FROM=noreply@hometution.com

# Google
GOOGLE_MAPS_API_KEY=your-api-key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Create Catalyst Datastore Tables

For now, the code uses a simplified in-memory structure. In production, create these tables in Catalyst:

**Parent Table:**
- id (primary)
- name, phone, email, relationship
- verification_status, created_at

**Student Table:**
- id (primary)
- parent_id (foreign key)
- name, class, board, subjects, created_at

**Tutor Table:**
- id (primary)
- name, phone, email, gender, qualification, experience
- subjects, classes, boards, languages
- latitude, longitude, service_radius
- verification_status, rating, created_at

**Lead Table:**
- id (primary)
- parent_id, student_id (foreign keys)
- status (new, contacted, qualified, matching, offered, accepted, demo_completed, converted)
- latitude, longitude, subjects, class, board, mode
- preferred_days, preferred_times, budget, created_at

**Demo Table:**
- id (primary)
- lead_id, tutor_id (foreign keys)
- scheduled_at, status, outcome, notes

**Enrolment Table:**
- id (primary)
- student_id, tutor_id (foreign keys)
- mode, plan, start_date, status

**ClassSession Table:**
- id (primary)
- enrolment_id (foreign key)
- date_time, attendance_tutor, attendance_student, notes

**Invoice Table:**
- id (primary)
- student_id, tutor_id (foreign keys)
- amount, due_date, status

**Payment Table:**
- id (primary)
- invoice_id (foreign key)
- amount, payment_method, reference_id, status

## Step 4: Start Development Servers

### Terminal 1: Backend

```bash
cd /Users/somyabhardwaj/Desktop/home/backend
npm run dev
```

Output:
```
home tution API running on port 5000
```

### Terminal 2: Frontend

```bash
cd /Users/somyabhardwaj/Desktop/home/frontend
npm run dev
```

Output:
```
▲ Next.js 14.0.0
- Local: http://localhost:3000
```

## Step 5: Access the Application

- **Landing Page:** http://localhost:3000
- **Parent Register:** http://localhost:3000/parent/register
- **Tutor Register:** http://localhost:3000/tutor/register
- **Admin Dashboard:** http://localhost:3000/admin/dashboard
- **API Health:** http://localhost:5000/health

## Step 6: Test the Application

### Test Parent Registration

1. Go to http://localhost:3000/parent/register
2. Fill in the form (multi-step):
   - Step 1: Parent details
   - Step 2: Student details
   - Step 3: Tuition requirements
   - Step 4: Review & submit
3. Should see success message
4. Check backend logs for API calls

### Test Tutor Registration

1. Go to http://localhost:3000/tutor/register
2. Fill in details
3. Should see success message

### Test Lead Matching

1. Backend has a sample matching endpoint
2. Call: `POST /api/leads/:leadId/match`
3. Should return ranked tutors with scores

### Test Admin Dashboard

1. Go to http://localhost:3000/admin/dashboard
2. Should show stats (currently with mock data)

## Troubleshooting

### Port Already in Use

```bash
# Find process on port 5000
lsof -i :5000

# Kill it
kill -9 <PID>
```

### Module Not Found

```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

### API Not Responding

Check that backend is running:
```bash
curl http://localhost:5000/health
```

Should return:
```json
{"status": "ok", "service": "home-tution-api"}
```

### Google Maps API Issues

- Verify API key is enabled for Maps JavaScript API
- Check quota usage in Google Cloud Console
- Add localhost to allowed domains (if applicable)

## Next Steps After MVP Completion

1. **Database Integration**
   - Implement actual Catalyst table operations
   - Add audit logging

2. **Authentication**
   - Implement OTP verification flow
   - Secure JWT tokens
   - Add rate limiting

3. **Geo-Matching**
   - Test with real coordinates
   - Optimize Haversine calculations
   - Add caching

4. **Email Notifications**
   - Test Zoho Mail integration
   - Create email templates
   - Set up retry logic

5. **Google Calendar**
   - Implement OAuth flow
   - Create/update calendar events
   - Handle timezone conversions

6. **Payment Tracking**
   - Implement invoice generation
   - Add payment recording UI
   - Create financial reports

7. **Testing**
   - Unit tests (Jest)
   - Integration tests
   - E2E tests (Cypress)

8. **Deployment**
   - Docker setup
   - GitHub Actions CI/CD
   - Production environment

## Development Tips

### Frontend Development
- Use React DevTools browser extension
- Hot reload is automatic with Next.js
- Check `app/globals.css` for styles
- Framer Motion docs: https://www.framer.com/motion/

### Backend Development
- Use Postman for API testing
- Check `src/services/` for business logic
- Logs appear in terminal
- Restart server when changing files (use nodemon)

### Environment Variables
- Copy `.env.example` to `.env.local`
- Never commit `.env.local`
- Frontend env vars must be prefixed with `NEXT_PUBLIC_`

## Project Structure Refresher

```
home-tution/
├── frontend/               # Next.js app
│   ├── app/
│   │   ├── page.jsx        # Landing page
│   │   ├── parent/         # Parent portal
│   │   ├── tutor/          # Tutor portal
│   │   └── admin/          # Admin dashboard
│   └── package.json
├── backend/                # Express API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Matching, email, geo, auth
│   │   ├── config/         # Catalyst DB
│   │   └── index.js        # Server entry
│   └── package.json
├── .env.local              # Your credentials (not in git)
├── .env.example            # Template
└── README.md               # Overview
```

## Getting Help

- Check API response errors in browser console
- Look at backend logs in terminal
- Test API endpoints with curl:
  ```bash
  curl -X GET http://localhost:5000/health
  ```
- Check Catalyst datastore status
- Verify all API keys in `.env.local`

---

**Version:** 1.0.0 (MVP)
**Last Updated:** October 2024

Ready to code! 🚀
