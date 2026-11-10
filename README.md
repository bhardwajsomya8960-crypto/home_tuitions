# Home & Online Tutor Hub

Connects parents with verified tutors for home and online tuition: enquiry, tutor matching, timed offers, demo class, enrolment, classes and fees, with separate portals for parents, tutors and staff.

| Part | Technology |
|---|---|
| Website and portals | Next.js 14, React 18, Tailwind CSS (`frontend/`) |
| API | Node.js 20, Express (`backend/`) |
| Database | MongoDB (MongoDB Atlas in production) via Mongoose |
| Files (tutor KYC) | Amazon S3 (private, encrypted); local disk in development |
| Hosting | AWS EC2 with Docker and Caddy (automatic HTTPS) |

## Folders

```
frontend/   app/ (routes) · features/{website,auth,parent,tutor,admin} · shared/{ui,data,shell,lib}
backend/    src/api/{website,parent,tutor,admin} (routes + controllers) · src/modules/<area> (models,
            services, validation) · src/db · src/shared · test/
deploy/aws/ production setup for EC2 + Atlas + S3
e2e/        browser walkthrough of the whole journey (Playwright)
docs/       architecture, setup, implementation status, blueprint
```

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for how the code is organised and how to add an API endpoint.

## Run locally

You need Node.js 20+ and MongoDB. The easiest way to get MongoDB is Docker:

```bash
docker compose up -d mongo          # MongoDB on localhost:27017 (replica set, transactions on)

cp .env.example .env.local          # then edit; MONGODB_URI is already set for the local database
cd backend && npm install && npm run setup:admin -- you@example.com   # staff sign-in
npm run seed:catalogue -- --sample  # optional sample courses
npm run seed:test-users             # optional test parents and tutors
npm run dev                         # API on http://localhost:5000

cd ../frontend && npm install && npm run dev   # website on http://localhost:3000
```

Or run everything in Docker with `docker compose up`.

Sign-in codes for parents and tutors are printed in the API log. Set `OTP_DEV_ECHO=true` in `.env.local` to also show them on screen during development.

| Portal | URL |
|---|---|
| Website | `/` |
| Parent and tutor sign-in | `/login` |
| Parent registration | `/parent/register` |
| Tutor registration | `/tutor/register` |
| Staff console | `/admin/login` |

More detail: [docs/SETUP.md](docs/SETUP.md).

## Tests

```bash
cd backend && npm test        # needs MongoDB (MONGODB_TEST_URI, default mongodb://127.0.0.1:27017)
node e2e/walkthrough.js       # full browser journey, see e2e/README.md
```

## Deploy

See **[deploy/aws/README.md](deploy/aws/README.md)**: MongoDB Atlas, an S3 bucket with an IAM role, one EC2 machine, then `docker compose up`.

## Status

What is built and what is not: [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).
# home_tuitions
