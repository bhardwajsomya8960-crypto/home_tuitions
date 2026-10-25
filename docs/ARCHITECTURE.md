# Code structure

Both apps are organised the same way: **by audience** (website, parent, tutor, admin) at the edges, and **by business area** (leads, tutors, billing, ...) inside the backend.

## Backend (`backend/src`)

```
server.js                 starts the API: loads env, connects MongoDB, runs background jobs
app.js                    Express app: security middleware, mounts the four API areas
config/                   environment loading, admin account configuration
db/
  connection.js           MongoDB connection (MONGODB_URI)
  defineModel.js          shared schema conventions (string ids, ISO timestamps)
  models.js               every model, by name
  repository.js           data access used by services (find, insert, update, transaction, ...)
api/                      HTTP layer, one folder per audience
  website/                /api/masters, /api/catalogue/*, /api/auth/*   (public)
  parent/                 /api/parents/*                                (parent portal)
  tutor/                  /api/tutors/*                                 (tutor portal)
  admin/                  /api/admin/*                                  (staff console)
    routes.js             every URL of that area in one place
    controllers/          one file per topic: read the request, call services, return data
modules/                  business logic, one folder per area
  leads/                  lead.model, leadEvent.model, lead.service, lead.views, lead.validation
  parents/                parent.model, student.model, parent.service, parentPortal.service
  tutors/                 tutor.model, tutorDocument.model, tutor/document/admin/portal services
  matching/               matching.engine (scores and filters), availability (weekly hours)
  assignments/            offers to tutors, accept/decline, manual assignment
  demos/  enrolments/  billing/  reviews/  settings/  audit/  dashboard/  catalogue/  auth/
  index.js                builds every service with its dependencies
services/                 outside systems: storage (S3 or local disk), geocoding, email
shared/                   errors, validation, master data, middleware, small utilities
jobs/                     background work (expiring tutor offers every 30 s)
```

### The layers

| Layer | Knows about | Never does |
|---|---|---|
| **Routes** (`api/<audience>/routes.js`) | URLs, which middleware, which controller | business rules |
| **Controllers** (`api/<audience>/controllers`) | the request (params, body, signed-in user) and response | database access |
| **Services** (`modules/<area>/*.service.js`) | business rules, validation, other services | HTTP |
| **Repository** (`db/repository.js`) | MongoDB | business rules |
| **Models** (`modules/<area>/*.model.js`) | fields, types, indexes | — |

- **Who is signed in:** comes only from the signed token (`requireUser('parent')`, `requireAdmin`). Services always receive the user id from the controller and check ownership themselves.
- **Validation:** request bodies are checked against field specs in `*.validation.js`. Unknown fields are rejected, and errors come back as `{ error, code, details: [{ field, message }] }`.
- **Transactions:** wrap multi-step writes in `repo.transaction(async () => { ... })`. Every repository call inside joins the transaction automatically.
- **Race-safe updates:** `repo.update(model, id, fields, where)` updates only while `where` still matches and returns 0 otherwise. This is how "first tutor to accept wins" works.
- **Audit:** every write calls `ctx.audit(actor, action, entity, id, details)`. Lead history uses `ctx.event(...)`.

### Adding an API endpoint

Example: let staff archive a student.

1. **Model.** If a field is new, add it to `modules/parents/student.model.js`.
2. **Service.** Add `archiveStudent(studentId, actor)` to `modules/parents/parent.service.js`. It loads with `ctx.require('Student', id, 'Student')`, checks the rules, updates with `repo.update`, and calls `ctx.audit`.
3. **Controller.** Add `archive: req => services.parents.archiveStudent(req.params.id, 'admin')` in a controller under `api/admin/controllers/`.
4. **Route.** Add `router.post('/students/:id/archive', json(controller.archive))` in `api/admin/routes.js`.
5. **Frontend path.** Add `studentArchive: id => \`/api/admin/students/${id}/archive\`` to `frontend/features/admin/api/endpoints.js`.
6. **Test.** Add a test in `backend/test/` and run `npm test`.

## Frontend (`frontend`)

```
app/                       routes only (Next.js App Router); each page.jsx re-exports a feature page
features/
  website/                 landing page sections, catalogue components, catalogue API client
  auth/pages/              parent and tutor sign-in
  parent/
    pages/                 ParentDashboardPage, ParentRegisterPage
    components/            RequestDetail, ClassesTab, NewRequestModal, AddStudentModal
    api/endpoints.js       every parent API path
  tutor/
    pages/                 TutorDashboardPage, TutorRegisterPage
    components/            availability/, verification/, offers/, classes/, VerificationBanner
    api/endpoints.js
  admin/
    pages/                 AdminDashboardPage, AdminLoginPage
    components/            tabs/ (Overview, Leads, Operations, Tutors, Finance, Settings, Audit),
                           LeadWorkspace, TutorReview, NewLeadModal, SettingsForm
    hooks/useAdminData.js
    api/endpoints.js
shared/
  ui/                      Card, Form fields, Modal, Badge, SimpleTable, WeeklyHours, PhoneVerify, ...
  data/                    DataTable (search, filters, paging), Pagination
  shell/                   AppShell (sidebar, top bar, account menu, mobile navigation)
  brand/                   Logo
  lib/                     api client, formatting, hooks (usePortal, useMasters), website endpoints
```

- **Imports** use the `@/` alias (for example `import Modal from '@/shared/ui/Modal'`).
- **Ownership:** a component used by one audience lives in that feature folder. Move it to `shared/` only when a second audience needs it.
- **API paths** are never written inside components. Add them to the feature's `api/endpoints.js`, which mirrors the backend `routes.js` for the same audience.

## Data

MongoDB collections, one per model:

| Area | Collections |
|---|---|
| People | `parents`, `students`, `tutors` |
| Tutor KYC | `tutor_documents` (details only; the files themselves are in S3) |
| Leads | `leads`, `lead_events` |
| Matching | `match_runs`, `assignments` |
| Teaching | `demos`, `enrolments`, `class_sessions` |
| Money | `invoices`, `payments` |
| Other | `reviews`, `settings`, `audit_log`, `categories`, `courses`, `counters` |

Conventions:

- **Ids** are time-ordered UUID strings.
- **Timestamps** are ISO-8601 strings in UTC.
- **Calendar dates** are `YYYY-MM-DD` strings (India time for "today").
- **Readable numbers** (`HT-L-000123`, `HT-INV-000045`) come from atomic counters.
