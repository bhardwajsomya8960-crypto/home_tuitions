# Multi-Port Setup Guide — home tution

Run all services on different ports for development, testing, and production.

## Port Configuration

| Service | Port | URL |
|---------|------|-----|
| **Backend API** | 5000 | http://localhost:5000 |
| **Frontend (Landing + All Portals)** | 3000 | http://localhost:3000 |
| **Tutor Portal** | 3001 | http://localhost:3001 |
| **Parent Portal** | 3002 | http://localhost:3002 |
| **Admin Portal** | 3003 | http://localhost:3003 |

---

## Option 1: Run Locally (npm) - Different Ports

### Terminal 1: Backend (Port 5000)

```bash
cd /Users/somyabhardwaj/Desktop/home/backend
npm install
PORT=5000 npm run dev
```

**Output:**
```
home tution API running on port 5000
```

---

### Terminal 2: Frontend Main (Port 3000)

```bash
cd /Users/somyabhardwaj/Desktop/home/frontend
npm install
PORT=3000 npm run dev
```

**Output:**
```
▲ Next.js 14.0.0
- Local: http://localhost:3000
```

---

### Terminal 3: Tutor Portal Separate (Port 3001)

```bash
# Use same frontend code, just different port
cd /Users/somyabhardwaj/Desktop/home/frontend
PORT=3001 npm run dev
```

---

### Terminal 4: Parent Portal Separate (Port 3002)

```bash
cd /Users/somyabhardwaj/Desktop/home/frontend
PORT=3002 npm run dev
```

---

### Terminal 5: Admin Portal Separate (Port 3003)

```bash
cd /Users/somyabhardwaj/Desktop/home/frontend
PORT=3003 npm run dev
```

---

## Option 2: Docker Multi-Service

### Build & Run All Services on Different Ports

```bash
cd /Users/somyabhardwaj/Desktop/home

# Copy port configuration
cp .env.ports .env.local

# Build all services
docker-compose -f docker-compose.multi.yml build

# Start all services
docker-compose -f docker-compose.multi.yml up
```

**Expected Output:**
```
home-tution-backend           | home tution API running on port 5000
home-tution-frontend-main     | ▲ Next.js 14.0.0 - Local: http://localhost:3000
home-tution-tutor-portal      | ▲ Next.js 14.0.0 - Local: http://localhost:3001
home-tution-parent-portal     | ▲ Next.js 14.0.0 - Local: http://localhost:3002
home-tution-admin-portal      | ▲ Next.js 14.0.0 - Local: http://localhost:3003
```

---

## Option 3: Custom Ports

### Edit `.env.local` to use custom ports:

```env
# Custom ports
BACKEND_PORT=8000
FRONTEND_PORT=4000
TUTOR_PORTAL_PORT=4001
PARENT_PORTAL_PORT=4002
ADMIN_PORTAL_PORT=4003

# API URL (for frontend to connect to backend)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Then run:

```bash
docker-compose -f docker-compose.multi.yml up
```

---

## Quick Access URLs

When all services are running:

```
🌐 LANDING PAGE & MAIN PORTAL
   http://localhost:3000

👨‍🏫 TUTOR DASHBOARD
   http://localhost:3000/tutor/dashboard
   (or separate: http://localhost:3001/tutor/dashboard)

👨‍👩‍👧 PARENT DASHBOARD
   http://localhost:3000/parent/dashboard
   (or separate: http://localhost:3002/parent/dashboard)

⚙️ ADMIN DASHBOARD
   http://localhost:3000/admin/dashboard
   (or separate: http://localhost:3003/admin/dashboard)

🔌 API HEALTH
   http://localhost:5000/health
```

---

## Docker Commands for Multi-Port Setup

### Start all services
```bash
docker-compose -f docker-compose.multi.yml up
```

### Start in background
```bash
docker-compose -f docker-compose.multi.yml up -d
```

### View logs all services
```bash
docker-compose -f docker-compose.multi.yml logs -f
```

### View logs specific service
```bash
docker-compose -f docker-compose.multi.yml logs -f backend
docker-compose -f docker-compose.multi.yml logs -f tutor-portal
```

### Stop all services
```bash
docker-compose -f docker-compose.multi.yml down
```

### Restart a specific service
```bash
docker-compose -f docker-compose.multi.yml restart tutor-portal
```

### View running services
```bash
docker-compose -f docker-compose.multi.yml ps
```

---

## Network Architecture

```
┌─────────────────────────────────────────────────────┐
│            Docker Network (Bridge)                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │          Backend (Port 5000)                 │  │
│  │   Node.js Express API                        │  │
│  │   http://backend:5000 (internal)             │  │
│  └──────────────────────────────────────────────┘  │
│                     △                              │
│        ┌────────────┼────────────┐                 │
│        │            │            │                 │
│  ┌─────▼──┐  ┌─────▼──┐  ┌─────▼──┐  ┌──────┐    │
│  │Main    │  │Tutor   │  │Parent  │  │Admin │    │
│  │:3000   │  │:3001   │  │:3002   │  │:3003 │    │
│  │        │  │        │  │        │  │      │    │
│  │(all    │  │(tutor  │  │(parent │  │(ops) │    │
│  │portals)│  │only)   │  │only)   │  │      │    │
│  └────────┘  └────────┘  └────────┘  └──────┘    │
│                                                     │
│                                                     │
│        External Access (from browser):             │
│        localhost:3000   ──→ Main                   │
│        localhost:3001   ──→ Tutor                  │
│        localhost:3002   ──→ Parent                 │
│        localhost:3003   ──→ Admin                  │
│        localhost:5000   ──→ API                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Development Workflow

### Local Development (5 Terminals)

**Terminal 1: Backend**
```bash
cd backend && npm run dev
```

**Terminal 2: Main Frontend**
```bash
cd frontend && PORT=3000 npm run dev
```

**Terminals 3-5: Additional Portals**
```bash
# Terminal 3
cd frontend && PORT=3001 npm run dev

# Terminal 4
cd frontend && PORT=3002 npm run dev

# Terminal 5
cd frontend && PORT=3003 npm run dev
```

### Docker Development (1 Command)

```bash
docker-compose -f docker-compose.multi.yml up
```

All services start automatically with hot-reload enabled.

---

## Testing Scenarios

### Test All Portals Independently

1. **Landing Page:** http://localhost:3000
2. **Tutor Admin:** http://localhost:3001/tutor/dashboard
3. **Parent Admin:** http://localhost:3002/parent/dashboard
4. **Internal Admin:** http://localhost:3003/admin/dashboard

Each runs independently but shares the same backend API.

### Test API Integration

```bash
# Test backend health
curl http://localhost:5000/health

# Expected response
{"status": "ok", "service": "home-tution-api"}

# Test with different API URLs from each frontend
# Port 3000: NEXT_PUBLIC_API_URL=http://backend:5000
# Port 3001: NEXT_PUBLIC_API_URL=http://backend:5000
# Port 3002: NEXT_PUBLIC_API_URL=http://backend:5000
# Port 3003: NEXT_PUBLIC_API_URL=http://backend:5000
```

---

## Production Port Configuration

For production, map to standard web ports:

```env
BACKEND_PORT=80
FRONTEND_PORT=8080
ADMIN_PORT=8081
```

Or use reverse proxy (Nginx):

```nginx
# api.hometution.com → backend:5000
# tutor.hometution.com → frontend:3001
# parent.hometution.com → frontend:3002
# admin.hometution.com → frontend:3003
```

---

## Troubleshooting

### Port Already in Use

**Check what's using a port:**
```bash
lsof -i :3000
lsof -i :5000
```

**Kill the process:**
```bash
kill -9 <PID>
```

**Or use different port:**
```bash
PORT=3010 npm run dev
```

### Docker Port Conflicts

```bash
# Clear all stopped containers
docker-compose -f docker-compose.multi.yml down -v

# Rebuild without cache
docker-compose -f docker-compose.multi.yml build --no-cache

# Start fresh
docker-compose -f docker-compose.multi.yml up
```

### Services Can't Communicate

**Check network connectivity:**
```bash
docker-compose -f docker-compose.multi.yml exec frontend-main \
  curl http://backend:5000/health
```

**Check service names:**
- Backend: `backend`
- Frontend: `frontend-main`, `tutor-portal`, `parent-portal`, `admin-portal`

---

## Environment Variables Reference

```env
# Backend
BACKEND_PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key

# Catalyst
CATALYST_PROJECT_ID=your_id
CATALYST_API_KEY=your_key

# Zoho Mail
ZOHO_MAIL_USER=your_email
ZOHO_MAIL_PASSWORD=your_password

# Google APIs
GOOGLE_MAPS_API_KEY=your_key

# Frontend URLs (internal Docker)
NEXT_PUBLIC_API_URL=http://backend:5000

# Frontend Ports
FRONTEND_PORT=3000
TUTOR_PORTAL_PORT=3001
PARENT_PORTAL_PORT=3002
ADMIN_PORTAL_PORT=3003
```

---

## Summary

| Setup | Command | Ports | Use Case |
|-------|---------|-------|----------|
| **Local Dev** | `npm run dev` (5 terminals) | 3000-3003, 5000 | Development |
| **Docker Single** | `docker-compose up` | 3000, 5000 | Simple deployment |
| **Docker Multi** | `docker-compose -f docker-compose.multi.yml up` | 3000-3003, 5000 | Full platform test |
| **Custom Ports** | Edit `.env.local` + docker | Custom | Staging/Production |

---

**Version:** 1.0.0  
**Last Updated:** October 2024
