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

## City landing pages

`/noida`, `/delhi`, area pages such as `/noida/sector-62`, and the ad page `/tutors-near-me` are built from one config file, [`frontend/features/website/cities/cities.config.js`](frontend/features/website/cities/cities.config.js), using one template ([`CityPage.jsx`](frontend/features/website/cities/CityPage.jsx)). They are static pages built at deploy time. Each has its own title, description, canonical URL, Open Graph and Twitter tags, breadcrumbs, and JSON-LD (LocalBusiness + EducationalOrganization, BreadcrumbList, FAQPage). Leads from the page's form go to the same email route as the homepage form, with the city, area, page and UTM parameters.

### Adding a new city

1. Add an entry to `CITIES` in `cities.config.js` (copy an existing one):
   - `slug` (the address, e.g. `gurgaon` → `/gurgaon`), `name`, `nameHindi`.
   - `intro`: **write a new paragraph for this city.** Mention its localities and how families there live and commute; do not copy another city's text with the name swapped.
   - `areas`: the localities you serve. Every area gets a page at `/<city>/<area slug>` (see below).
   - `tutorCount`: the real number of tutors there, or `null` to hide the stat. Never estimate it.
   - `homeTuitionAvailable`: `false` if you only offer online classes there.
   - `whatsappNumber` (defaults to the business number), `address` (only a public address customers can visit, else `null`), and `seo` (`title` up to 60 characters, `description` up to 155).
2. Run `npm run build` in `frontend/`, then `npm start` and `npm run check:seo` (below).
3. Deploy. The page, its area pages, the sitemap entry and the footer link appear automatically.

### Area pages

Each area in the config has `name`, `slug` (and an optional `shortName` for titles), plus content fields: `intro` (80–150 words written for that area only), `nearbyLandmarks`, `nearbyAreas` (slugs of neighbouring areas, shown as "Nearby areas we also cover"), `schoolsNearby` (names only; the page says we are not affiliated) and `notes` (internal, never shown). Fill them only with real information.

An area page is **noindex and left out of the sitemap** until you set `indexable: true` **and** its intro is 80–150 words. This keeps near-identical pages from competing with the city page (Google treats them as doorway pages). Until then the page still works for ads and links, showing the city intro and the city's other areas.

### Ad landing page: /tutors-near-me

A third page greets each visitor with their own city: "Verified tutors in Lucknow, at home or online". The city comes from `?city=` in the link (use it for ads aimed at one city, e.g. `/tutors-near-me?city=Gurugram&utm_source=…`), or else from the visitor's location, which Vercel adds to each request (India only; IP locations are approximate, so the copy never depends on them). Visitors from a city with its own page (Noida, Delhi, New Delhi, or any `aliases` in the config) are sent there, keeping the UTM parameters. The page promises only what is true everywhere: a home tutor where one is nearby, live online classes otherwise. It is rendered per visit and is `noindex`; leads from it arrive with the city marked as "from the visitor's location or ad link". Logic: [`features/website/cities/nearMe.js`](frontend/features/website/cities/nearMe.js).

### Verification claims

`VERIFICATION_ENABLED` at the top of the config controls every "verified" / "ID-checked" claim: the word "Verified" in headings, the ID-check card, the verification steps, that FAQ, and the `/how-we-verify` trust page with every link to it (city pages and the footer). Set it to `false` and all of them disappear (`/how-we-verify` returns 404).

### Business details, profiles and tracking

Name, service area, phone, email and profile links live in [`frontend/features/website/contact.js`](frontend/features/website/contact.js): the footer's NAP line ("Home & Online Tutor Hub · Serving Noida & Delhi NCR · +91 89602 74119") and all structured data read them from there. Set in Vercel → Settings → Environment Variables (then redeploy):

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_CONTACT_EMAIL` | email in the footer and the Organization data |
| `NEXT_PUBLIC_GBP_URL`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_JUSTDIAL_URL` | `sameAs` profile links (empty ones are left out) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel: PageView, `Lead` on a sent form, `Contact` on WhatsApp/Call taps, with the city |
| `NEXT_PUBLIC_GA4_ID` | Google Analytics 4 |
| `NEXT_PUBLIC_SITE_URL` | site address for canonical URLs and the sitemap (default `https://hometuitions.koshatech.com`) |

### Blog

Posts are Markdown files in `frontend/content/blog/<slug>.md`, published at `/blog/<slug>` with Article structured data and a "find a tutor in this city" box. [`content/blog/example-draft.md`](frontend/content/blog/example-draft.md) explains the front matter (title, description, author, date, city, draft). Drafts are noindex and kept off the blog list and the sitemap; `/blog` itself stays noindex until the first post is published.

### SEO check

`npm run check:seo` (in `frontend/`, against a running site: `npm run build && npm start` first, or pass a URL) loads every public page and checks the JSON-LD parses and matches the page (FAQ text, breadcrumbs), title and description lengths and uniqueness, canonical / Open Graph / Twitter tags and the share image, alt text, `#anchor` targets, and that `sitemap.xml` lists exactly the indexable pages with `lastmod`. Add `--print /noida,/noida/sector-62` to print those pages' JSON-LD.

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
# home_tuitions
