# Docker Setup — home tution

This guide walks you through running the application using Docker and Docker Compose.

## Prerequisites

- Docker (v20+)
- Docker Compose (v1.29+)

Check installation:
```bash
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone & Navigate

```bash
cd /Users/somyabhardwaj/Desktop/home
```

### 2. Create Environment File

```bash
cp .env.example .env.local
```

**Edit `.env.local`** with your credentials:
```env
# Required credentials (get from setup guide)
CATALYST_PROJECT_ID=your_id
CATALYST_API_KEY=your_key
ZOHO_MAIL_USER=your_email@zoho.in
ZOHO_MAIL_PASSWORD=your_app_password
GOOGLE_MAPS_API_KEY=your_api_key

# Optional (defaults work locally)
JWT_SECRET=dev-secret-key
NEXT_PUBLIC_API_URL=http://backend:5000
```

### 3. Build & Start Containers

```bash
# Build images
docker-compose build

# Start services
docker-compose up
```

**Expected Output:**
```
home-tution-backend | home tution API running on port 5000
home-tution-frontend | ▲ Next.js 14.0.0
home-tution-frontend | - Local: http://localhost:3000
```

### 4. Access the Application

- **Landing Page:** http://localhost:3000
- **Parent Register:** http://localhost:3000/parent/register
- **Tutor Register:** http://localhost:3000/tutor/register
- **Admin Dashboard:** http://localhost:3000/admin/dashboard
- **API Health:** http://localhost:5000/health

---

## Common Commands

### Start Services
```bash
docker-compose up
```

### Start in Background
```bash
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Stop Services
```bash
docker-compose down
```

### Stop & Remove All Data
```bash
docker-compose down -v
```

### Rebuild Services
```bash
docker-compose build --no-cache
docker-compose up
```

### Execute Commands in Container
```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Run backend npm command
docker-compose exec backend npm run dev
```

### View Service Status
```bash
docker-compose ps
```

---

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use:

```bash
# Find what's using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change docker-compose ports:
# Change "3000:3000" to "3001:3000"
```

### Build Fails

```bash
# Clean build
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up
```

### API Not Responding

```bash
# Check backend logs
docker-compose logs backend

# Check if backend is healthy
docker-compose ps

# Manually test
curl http://localhost:5000/health
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs frontend

# Check if NEXT_PUBLIC_API_URL is correct in .env.local
# Should be: http://backend:5000 (inside Docker)
```

### Rebuild After Code Changes

For development, changes are auto-reloaded via volumes. If you need a full rebuild:

```bash
docker-compose down
docker-compose build
docker-compose up
```

---

## Docker Architecture

```
┌─────────────────────────────────────────┐
│        Docker Network (Bridge)          │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────┐           │
│  │   Frontend Container     │           │
│  │  (Next.js on :3000)      │           │
│  │                          │           │
│  │  http://localhost:3000   │◄──┐       │
│  └──────────────────────────┘   │       │
│              ▼                   │       │
│  ┌──────────────────────────┐   │       │
│  │   Backend Container      │   │       │
│  │  (Express on :5000)      │   │       │
│  │                          │   │       │
│  │  http://backend:5000     │   │       │
│  │  (from within network)   │   │       │
│  └──────────────────────────┘   │       │
│                                 │       │
│  External Access:               │       │
│  localhost:3000 ────────────────┘       │
│  localhost:5000                         │
│                                         │
└─────────────────────────────────────────┘
```

---

## Environment Variables

### Backend Variables
- `PORT` — API port (default: 5000)
- `NODE_ENV` — Environment (development/production)
- `JWT_SECRET` — JWT signing key (change in production)
- `CATALYST_PROJECT_ID` — Your Catalyst project ID
- `CATALYST_API_KEY` — Your Catalyst API key
- `ZOHO_MAIL_*` — Email configuration
- `GOOGLE_MAPS_API_KEY` — Google Maps API key
- `GOOGLE_CALENDAR_*` — Google Calendar OAuth config

### Frontend Variables
- `NEXT_PUBLIC_API_URL` — Backend API URL (must start with NEXT_PUBLIC_)
- `NEXT_PUBLIC_APP_URL` — Frontend URL
- `NODE_ENV` — Environment

**Important:** Frontend vars must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

---

## Development vs Production

### Development (Current)

```bash
docker-compose up
```

- Hot reload enabled
- Source code mounted as volumes
- Debug logging active
- Slower first start (installs deps)

### Production (Future)

```bash
docker-compose -f docker-compose.prod.yml up
```

- Optimized images
- No source code mounting
- Minimal logging
- Smaller image sizes

---

## Health Checks

Both services have health checks configured:

```bash
# View health status
docker-compose ps

# Example output:
# NAME                       STATUS
# home-tution-backend        Up 2 minutes (healthy)
# home-tution-frontend       Up 1 minute (healthy)
```

---

## Networking

Services communicate via Docker network:

- **Frontend → Backend:** Use `http://backend:5000`
- **External → Frontend:** Use `http://localhost:3000`
- **External → Backend:** Use `http://localhost:5000`

The docker-compose.yml sets `NEXT_PUBLIC_API_URL=http://backend:5000` to enable internal communication.

---

## Volumes & Persistence

Current setup uses:
- **Source code volumes:** For hot reload during development
- **node_modules:** Built inside containers (not mounted)

For production, remove volumes and use built images.

---

## Next Steps

1. **Deploy to Cloud:**
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Instances
   - Digital Ocean App Platform

2. **Add Services:**
   - Database service (PostgreSQL with PostGIS)
   - Redis for caching
   - Nginx reverse proxy

3. **Add Monitoring:**
   - Prometheus metrics
   - ELK stack logging
   - Application monitoring

4. **CI/CD Integration:**
   - GitHub Actions
   - Automated builds on push
   - Automated deployments

---

## Support

For Docker-related issues:
- Check `.env.local` configuration
- View logs: `docker-compose logs`
- Rebuild: `docker-compose build --no-cache`
- Clean slate: `docker-compose down -v`

---

**Version:** 1.0.0
**Last Updated:** October 2024
