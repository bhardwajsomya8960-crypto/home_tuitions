# Learning Catalogue: audit and proposal

Status: Phase A implemented (see section 6). Phase B and C are not started.

## 1. Audit of the current repository

| Area | What the code does | Evidence |
|---|---|---|
| Persistence | All records live in JavaScript arrays. Data is lost on restart. | `backend/src/config/catalyst.js` (`this.data = { parents: [], ... }`) |
| Zoho Catalyst | Not integrated. No Catalyst SDK is in `backend/package.json`. The file name is the only link. | `backend/package.json`; `.env.example` lists `CATALYST_PROJECT_ID` and `CATALYST_API_KEY`, which nothing reads. |
| Admin authentication | None. Admin routes have no auth check. | `backend/src/routes/admin.js` has no middleware; no `middleware/` directory exists. |
| Roles | The role comes from the request body and is written into the token without checking. | `backend/src/routes/auth.js:40-57` |
| OTP | Codes are random and printed to the console. | `backend/src/services/authService.js:11-16` |
| Public API | Routes exist for parents, tutors, leads, etc. None serve catalogue content. | `backend/src/index.js` |
| Frontend data | Dashboards use hard-coded sample arrays. Only the registration forms call the API. | `frontend/app/*/dashboard/page.jsx` |

Conclusion: the catalogue cannot be stored persistently, and admin writes cannot be restricted, until persistence and admin authorisation are in place.

## 2. Proposed data model

Stored as separate collections (not nested) so subjects can be shared.

- **Category**: id, slug (unique), name, shortDescription, longDescription, iconKey, accentColour, coverImage, displayOrder, featured, status (`draft | published | archived`), seoTitle, seoDescription, createdAt, updatedAt, createdBy, updatedBy.
- **Course**: id, slug (unique), name, categoryId, parentProgramId (optional), academicLevelId, shortDescription, description, applicableFor (class / degree / exam text list), subjectIds[], syllabusOverview, learningObjectives[], prerequisites[], targetAudience, learningModes (`home | online`, both allowed), coverImage, featured, displayOrder, status, SEO fields, audit fields.
- **Subject**: id, slug (unique), name, familyId (optional), description, status, audit fields. Reused across courses.
- **SubjectFamily**: id, slug, name, displayOrder.
- **AcademicLevel**: id, slug, name, kind (`stage | class | degree | exam | skill`), parentId (for streams and semesters), displayOrder, status.
- **CourseEnquiry** (extends existing parent registration): add optional `courseId` and `courseSlug`. Existing fields stay unchanged.

Only published categories and courses are returned publicly. Archived records are excluded from all public responses.

## 3. Proposed API

Public (no auth, published only):
- `GET /api/catalogue/categories`
- `GET /api/catalogue/categories/:slug`
- `GET /api/catalogue/courses?q=&category=&level=&subject=&mode=&page=&limit=`
- `GET /api/catalogue/courses/:slug`
- `GET /api/catalogue/subjects`, `GET /api/catalogue/levels`

Admin (requires an admin token, enforced by middleware):
- CRUD for categories, courses, subjects, academic levels.
- `POST .../publish`, `POST .../unpublish`, `POST .../archive`.
- `PATCH` for `featured` and `displayOrder`.
- `POST /api/admin/catalogue/bulk` with an explicit list of ids and an action.

Every write validates input on the server, checks slug uniqueness, and returns a consistent error shape.

## 4. Decisions needed before building

1. **Persistence.** Options:
   - A. Keep building against the in-memory store. Not acceptable for admin-managed content.
   - B. Add a file-backed or SQLite store behind a repository interface now. Catalyst can replace it later without changing the routes. Recommended.
   - C. Connect Zoho Catalyst now. Needs the Catalyst SDK installed, a configured project, and table definitions. I cannot verify this without the project details and access.
2. **Admin authentication.** Required for any admin write. Proposed: a server-side admin account (credentials from environment variables), signed tokens, and middleware that checks the role on every admin route. The current role-from-body behaviour must be removed.
3. **Phasing.** Proposed:
   - Phase A: data model, public read API, admin CRUD for categories and courses, publish/unpublish/featured/order, public category and course pages, seed data, tests.
   - Phase B: subject and academic-level management, bulk actions, course-to-enquiry prefill.
   - Phase C: duplicate course, image upload, preview tokens.
4. **Enquiry integration.** Adding `courseId` to the parent registration payload is a change to a working flow. Confirm this is acceptable.

## 6. Phase A status

Implemented:
- Storage: SQLite behind a repository contract (`backend/src/repositories/catalogueRepository.js`), with ordered migrations (`backend/src/db/migrations/`). Development only.
- Admin authentication: a server-side admin account from environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_JWT_SECRET`), bcrypt verification, HS256 tokens with issuer, audience and expiry, and `requireAdmin` on every `/api/admin` route except login. Failed logins are rate-limited per account and per IP.
- Role escalation closed: `POST /api/auth/verify-otp` accepts only `parent` or `tutor`.
- Catalogue: categories and courses with draft, publish, unpublish, archive and restore; featured flag; display order; slug uniqueness; server-side validation that rejects unknown fields.
- Publication rules: a course is public only when it and its category are published. Publishing a course requires its category to be published. Archiving a category with active courses is refused.
- Public read API: `GET /api/catalogue/categories`, `/categories/:slug`, `/courses`, `/courses/:slug`. Published content only.
- Admin API: `/api/admin/catalogue/categories` and `/courses`, with create, read, edit and lifecycle actions.
- Parent registration: optional `courseId` and `courseSlug`, validated before any record is written. Existing requests without them are unchanged.
- Seed: `npm run seed:catalogue -- --sample` (or `node scripts/seed-catalogue.js --sample`). Idempotent, never overwrites existing slugs, marks records `source: sample`.
- Public pages: `/courses` (search, category and mode filters, pagination), `/courses/[slug]`, `/categories/[slug]`, and a category section on the landing page. All content comes from the API. When the API is down, pages show a retry message, not sample data.

Not in Phase A (deferred as agreed):
- Admin user interface for the catalogue. Phase A is API only; use the admin token with an HTTP client.
- Subject and academic-level management. Course subjects are stored as text lists for now.
- Bulk operations, enquiry prefill from a course page, duplicate course, image upload, preview tokens.

Verified by automated tests (`npm test` in `backend/`, 49 tests): admin login and lockout; token forgery, wrong role and expiry; admin routes requiring a token; role escalation through OTP input; publication and archive rules; public visibility; slug uniqueness at the service and database level; validation; persistence across a restart; migration idempotence; registration with and without course fields; seed idempotence and protection of admin edits.

## 7. Required before production

- Replace SQLite with a verified, shared, backed-up datastore. Zoho Catalyst is still not connected.
- Run behind HTTPS. Set `ADMIN_JWT_SECRET` and `JWT_SECRET` to long random values, different from each other.
- Rate limiting is per process and in memory. Add limits at the reverse proxy as well.
- The Docker image uses Node 18. `better-sqlite3` is a native module and has not been tested in that image.
- Existing routes outside the catalogue are still unauthenticated. This includes parent and tutor profile reads (`GET /api/parents/:parentId`, `GET /api/tutors/:tutorId`) and `GET /api/leads/:leadId`. Not changed in Phase A; needs a decision.
- User OTP tokens still fall back to a built-in JWT secret when `JWT_SECRET` is not set.

