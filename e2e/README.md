# End-to-end UI walkthrough

`walkthrough.js` drives the real app in Chromium (Playwright) through the core journey:

1. A tutor registers (phone code, teaching details, availability grid, profile, consent) and uploads KYC documents.
2. An admin reviews and accepts each document, then verifies and activates the tutor.
3. A parent registers on a phone-sized screen with their device location.
4. The admin runs matching and sends the offer.
5. The tutor sees the offer **without** parent name, phone or address, and accepts.
6. The admin confirms, schedules and completes the demo, and converts the lead.
7. The parent sees the tutor's contact, upcoming classes and the invoice, and rates the tutor.
8. The tutor pauses new leads; the admin records the payment, checks the audit log and saves matching rules.

It fails on any page error or console error, and if a tutor offer exposes parent details. Screenshots go to `e2e/output/` (git-ignored).

## Run it

It needs an **empty** database, because it registers fixed phone numbers. Start MongoDB first (`docker compose up -d mongo` from the repository root).

```bash
# 1. Backend on :5055 with a throwaway database and codes echoed in responses
cd backend
export PORT=5055 OTP_DEV_ECHO=true JWT_SECRET=$(openssl rand -hex 24) ADMIN_JWT_SECRET=$(openssl rand -hex 24)
export ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD_HASH="$(printf '%s' 'admin-password-123' | node scripts/hash-admin-password.js)"
export MONGODB_URI='mongodb://127.0.0.1:27017/ht-e2e?directConnection=true' UPLOADS_DIR=/tmp/ht-e2e-uploads
mongosh --quiet "$MONGODB_URI" --eval 'db.dropDatabase()'   # or: docker compose exec mongo mongosh ht-e2e --eval 'db.dropDatabase()'
node src/server.js &

# 2. Frontend on :3055 pointing at that backend
cd ../frontend
NEXT_PUBLIC_API_URL=http://localhost:5055 npx next build && npx next start -p 3055 &

# 3. Walkthrough (Playwright must be installed: npm i -D playwright && npx playwright install chromium)
cd .. && node e2e/walkthrough.js
```

Environment overrides: `E2E_BASE_URL`, `E2E_OUT_DIR`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.
