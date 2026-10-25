# Local setup

## Requirements

- Node.js 20 or newer
- MongoDB 7. Run it with Docker: `docker compose up -d mongo`. This starts a single-node replica set, so transactions work as they do on MongoDB Atlas. A MongoDB you installed yourself also works; without a replica set, transactions are skipped and a warning is printed.

## 1. Settings

```bash
cp .env.example .env.local
```

The API reads `.env.local` in the repository root, then `backend/.env`. For local development, the defaults in the example are enough apart from the admin account (next step):

- `MONGODB_URI=mongodb://127.0.0.1:27017/hometutor?directConnection=true`
- `STORAGE_DRIVER=local`: tutor documents go to `UPLOADS_DIR` on disk
- `OTP_DEV_ECHO=true`: shows sign-in codes on screen (development only)

## 2. Backend

```bash
cd backend
npm install
npm run setup:admin -- you@example.com     # asks for a password; writes the staff login to .env.local
npm run seed:catalogue -- --sample         # optional: sample categories and courses
npm run seed:test-users                    # optional: 2 parents, 3 verified tutors, 3 leads
npm run dev                                # http://localhost:5000, reloads on change
```

Test accounts from `seed:test-users` sign in by phone number with a one-time code, which is printed in the API log:

- Parents: 9900100001, 9900100002
- Tutors: 9900200001, 9900200002, 9900200003

## 3. Frontend

```bash
cd frontend
npm install
npm run dev                                # http://localhost:3000
```

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:5000`.

## 4. Tests

```bash
cd backend && npm test
```

Each test file uses its own temporary database on the MongoDB from `MONGODB_TEST_URI` (default `mongodb://127.0.0.1:27017/?directConnection=true`) and drops it afterwards.

The browser walkthrough of the whole journey is described in `e2e/README.md`.

## Everything in Docker

```bash
docker compose up
```

This starts MongoDB, the API on port 5000 and the website on port 3000. Code changes reload automatically. Staff login values are read from `.env.local`.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Could not start the API: ... ECONNREFUSED 127.0.0.1:27017` | MongoDB is not running. Run `docker compose up -d mongo`. |
| Admin sign-in says "not configured" | Run `npm run setup:admin` in `backend/` and restart the API. |
| Uploads fail with a credentials error on EC2 | See step 3.3 of `deploy/aws/README.md` (instance metadata hop limit). |
