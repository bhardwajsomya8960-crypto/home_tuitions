// End-to-end UI walkthrough: tutor onboarding and KYC, admin verification, parent enquiry on a
// phone-sized screen, matching, timed offer, acceptance, confirmation, demo, conversion, invoice
// and payment. See e2e/README.md for how to run it against fresh local servers.
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3055'
const OUT = process.env.E2E_OUT_DIR || path.join(__dirname, 'output')
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin-password-123'
fs.mkdirSync(OUT, { recursive: true })
const shots = []
const problems = []
const openPages = []

async function shot(page, name) {
  const file = path.join(OUT, `${String(shots.length + 1).padStart(2, '0')}-${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  shots.push(file)
}

function watch(page, label) {
  openPages.push([label, page])
  page.on('pageerror', e => problems.push(`[${label}] pageerror: ${e.message}`))
  page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) problems.push(`[${label}] console: ${m.text()}`) })
}

async function verifyPhone(page, phone) {
  await page.getByLabel('Mobile number').fill(phone)
  await page.getByRole('button', { name: 'Send code' }).click()
  const dev = page.getByText(/your code is/)
  await dev.waitFor()
  const code = (await dev.locator('strong').textContent()).trim()
  await page.getByLabel(/Enter the 6-digit code/).fill(code)
  await page.getByRole('button', { name: 'Verify' }).click()
  await page.getByText(`+91 ${phone} verified`).waitFor()
}

;(async () => {
  const browser = await chromium.launch()
  const AMEERPET = { latitude: 17.4375, longitude: 78.4483 }
  const BEGUMPET = { latitude: 17.4440, longitude: 78.4620 }

  // ---------- 1. Tutor registers and uploads documents ----------
  const tutorCtx = await browser.newContext({ viewport: { width: 1280, height: 900 }, geolocation: BEGUMPET, permissions: ['geolocation'] })
  const tutor = await tutorCtx.newPage(); watch(tutor, 'tutor')
  await tutor.goto(`${BASE}/tutor/register`)
  await tutor.getByLabel('Full name').fill('Lakshmi Rao')
  await verifyPhone(tutor, '9800000001')
  await tutor.getByLabel('Email').fill('lakshmi@example.com')
  await tutor.getByRole('radio', { name: 'Female' }).click()
  await tutor.getByLabel('Current address').fill('12 Begumpet Main Road, Hyderabad')
  await tutor.getByLabel('Pincode').fill('500016')
  await tutor.getByRole('button', { name: 'Use my current location' }).click()
  await tutor.getByRole('button', { name: 'Location added ✓' }).waitFor()
  await tutor.getByRole('button', { name: 'Continue' }).click()

  await tutor.getByLabel('Highest qualification').selectOption('Master')
  await tutor.getByLabel('Years of teaching experience').fill('6')
  const group = name => tutor.getByRole('group', { name, exact: true })
  await group('Subjects').getByRole('checkbox', { name: 'Mathematics' }).click()
  await group('Subjects').getByRole('checkbox', { name: 'Science', exact: true }).click()
  for (const c of ['Class 7', 'Class 8', 'Class 9']) await group('Classes').getByRole('checkbox', { name: c, exact: true }).click()
  await group('Boards').getByRole('checkbox', { name: 'CBSE' }).click()
  await group('Teaching languages').getByRole('checkbox', { name: 'English' }).click()
  await group('Teaching languages').getByRole('checkbox', { name: 'Telugu' }).click()
  await group('Teaching mode').getByRole('checkbox', { name: "At the student's home" }).click()
  await group('Teaching mode').getByRole('checkbox', { name: 'Online' }).click()
  await tutor.getByRole('button', { name: 'Continue' }).click()

  // Continue without availability shows the inline error
  await tutor.getByRole('button', { name: 'Continue' }).click()
  await tutor.getByText('Choose at least one time you can teach').waitFor()
  for (const s of ['Tue 4–7 PM', 'Thu 4–7 PM', 'Sat 8 AM–12 PM']) await tutor.getByRole('button', { name: s }).click()
  await tutor.getByLabel('Expected fee from (₹ / month)').fill('2500')
  await tutor.getByLabel('Expected fee up to (₹ / month)').fill('3500')
  await shot(tutor, 'tutor-register-availability')
  await tutor.getByRole('button', { name: 'Continue' }).click()

  await tutor.getByLabel('About you').fill('I have taught middle-school maths and science for six years and focus on building strong fundamentals with practice.')
  await tutor.getByRole('checkbox', { name: /I accept the/ }).check()
  await tutor.getByRole('checkbox', { name: /You may send me lead offers/ }).check()
  await tutor.getByRole('button', { name: 'Create tutor account' }).click()
  await tutor.getByText("You're registered").waitFor()
  await tutor.getByRole('button', { name: 'Upload documents' }).click()
  await tutor.getByText('Account status').waitFor()

  const png = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex')
  const pdf = Buffer.from('%PDF-1.4\n%e2e\n')
  const inputs = tutor.locator('input[type=file]')
  await inputs.nth(0).setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: png })
  await tutor.getByText('Uploaded. We will review it shortly.').waitFor()
  await inputs.nth(1).setInputFiles({ name: 'aadhaar.pdf', mimeType: 'application/pdf', buffer: pdf })
  await tutor.getByText('aadhaar.pdf').waitFor()
  await inputs.nth(2).setInputFiles({ name: 'msc.pdf', mimeType: 'application/pdf', buffer: pdf })
  await tutor.getByText('msc.pdf').waitFor()
  await shot(tutor, 'tutor-verification-uploaded')

  // ---------- 2. Admin verifies and activates ----------
  const adminCtx = await browser.newContext({ viewport: { width: 1366, height: 900 } })
  const admin = await adminCtx.newPage(); watch(admin, 'admin')
  await admin.goto(`${BASE}/admin/login`)
  await admin.getByLabel('Email').fill(ADMIN_EMAIL)
  await admin.getByLabel('Password').fill(ADMIN_PASSWORD)
  await admin.getByRole('button', { name: 'Sign in' }).click()
  await admin.getByText('Lead pipeline').waitFor()
  await admin.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: /Tutors/ }).click()
  await admin.getByRole('button', { name: 'Review' }).first().click()
  const dialog = admin.getByRole('dialog', { name: 'Lakshmi Rao' })
  await dialog.getByText('KYC documents').waitFor()
  for (let i = 0; i < 3; i++) {
    await dialog.getByRole('button', { name: 'Accept', exact: true }).first().click()
    await dialog.getByText(/accepted\./).waitFor()
  }
  await dialog.getByRole('button', { name: 'Verify', exact: true }).click()
  await dialog.getByText('Verify: done.').waitFor()
  await dialog.getByRole('button', { name: 'Activate', exact: true }).click()
  await dialog.getByText('Activate: done.').waitFor()
  await shot(admin, 'admin-tutor-activated')
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()

  // ---------- 3. Parent registers on a phone ----------
  const parentCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, geolocation: AMEERPET, permissions: ['geolocation'] })
  const parent = await parentCtx.newPage(); watch(parent, 'parent')
  await parent.goto(`${BASE}/parent/register?mode=Home`)
  await parent.getByRole('button', { name: 'Continue' }).click()
  await parent.getByText('Enter your full name').waitFor()
  await shot(parent, 'parent-register-validation')
  await parent.getByLabel('Full name').fill('Ravi Kumar')
  await verifyPhone(parent, '9800000002')
  await parent.getByRole('radio', { name: 'Parent' }).click()
  await parent.getByRole('button', { name: 'Continue' }).click()
  await parent.getByLabel("Student's name").fill('Aarav')
  await parent.getByLabel('Class / grade').selectOption('8')
  await parent.getByLabel('Board').selectOption('CBSE')
  await parent.getByRole('group', { name: 'Subjects' }).getByRole('checkbox', { name: 'Mathematics' }).click()
  await parent.getByRole('button', { name: 'Continue' }).click()
  // mode was pre-selected from ?mode=Home
  await parent.getByLabel('Address where classes will happen').fill('Flat 4B, Ameerpet, Hyderabad')
  await parent.getByLabel('Pincode').fill('500016')
  await parent.getByRole('button', { name: 'Use my current location' }).click()
  await parent.getByRole('button', { name: 'Location added ✓' }).waitFor()
  await parent.getByRole('checkbox', { name: 'Tue' }).click()
  await parent.getByRole('checkbox', { name: 'Thu' }).click()
  await parent.getByRole('checkbox', { name: /Evening/ }).click()
  await parent.getByLabel('Monthly budget').selectOption('2000_4000')
  await parent.getByRole('button', { name: 'Continue' }).click()
  await parent.getByText('Check and submit').waitFor()
  await shot(parent, 'parent-register-review')
  await parent.getByRole('checkbox', { name: /I accept the/ }).check()
  await parent.getByRole('checkbox', { name: /You may contact me/ }).check()
  await parent.getByRole('button', { name: 'Submit request' }).click()
  await parent.getByText('Request received').waitFor()
  const leadCode = (await parent.getByText(/HT-L-\d+/).textContent()).match(/HT-L-\d+/)[0]
  await parent.getByRole('button', { name: 'Go to my dashboard' }).click()
  await parent.getByText('Your requests').waitFor()
  await shot(parent, 'parent-dashboard-new')

  // ---------- 4. Admin matches and offers ----------
  await admin.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: /Leads/ }).click()
  await admin.getByRole('button', { name: leadCode }).click()
  const lead = admin.getByRole('dialog', { name: new RegExp(leadCode) })
  await lead.getByRole('button', { name: 'Run matching' }).click()
  await lead.getByText('Matching complete.').waitFor()
  await lead.getByText('Lakshmi Rao').first().waitFor()
  await shot(admin, 'admin-matching-results')
  await lead.getByRole('button', { name: 'Offer to next tutor' }).click()
  await lead.getByText('Offer sent.').waitFor()

  // ---------- 5. Tutor sees a masked offer and accepts ----------
  await tutor.goto(`${BASE}/tutor/dashboard?tab=offers`)
  await tutor.getByRole('timer').first().waitFor()
  const offerText = await tutor.locator('main').innerText()
  if (offerText.includes('9800000002') || offerText.includes('Ravi') || offerText.includes('Flat 4B')) problems.push('Tutor offer exposes parent details before confirmation')
  await shot(tutor, 'tutor-offer')
  await tutor.getByRole('button', { name: 'Accept' }).click()
  await tutor.getByText(/Accepted\. Our team will confirm/).waitFor()

  // ---------- 6. Admin confirms, runs the demo and converts ----------
  await lead.getByRole('button', { name: 'Close', exact: true }).click()
  await admin.getByRole('button', { name: leadCode }).click()
  await lead.getByRole('button', { name: 'Confirm' }).click()
  await lead.getByText('Tutor confirmed. Contact details shared.').waitFor()
  const tomorrow = new Date(Date.now() + 330 * 60000 + 86400e3).toISOString().slice(0, 10)
  await lead.locator('input[type=datetime-local]').fill(`${tomorrow}T17:00`)
  await lead.getByLabel('Note / link').fill('Near Ameerpet metro')
  await lead.getByRole('button', { name: 'Schedule demo' }).click()
  await lead.getByText('Demo scheduled.', { exact: false }).waitFor()
  await lead.getByRole('button', { name: 'Completed', exact: true }).click()
  const done = admin.getByRole('dialog', { name: 'Demo completed' })
  await done.getByRole('radio', { name: 'Interested — proceed' }).click()
  await done.getByRole('button', { name: 'Save' }).click()
  await lead.getByText('Demo marked completed.').waitFor()
  await lead.getByLabel('Fee per plan period (₹)').fill('3000')
  await lead.getByLabel('Start date').fill(tomorrow)
  await lead.getByRole('button', { name: 'Convert and create first invoice' }).click()
  await lead.getByText(/Converted\. Enrolment/).waitFor()
  await shot(admin, 'admin-lead-converted')
  await lead.getByRole('button', { name: 'Close', exact: true }).click()

  // ---------- 7. Parent sees the tuition, tutor contact and invoice ----------
  await parent.reload()
  await parent.getByText('Needs your attention').waitFor()
  const parentText = await parent.locator('main').innerText()
  if (!parentText.includes('₹3,000')) problems.push('Parent overview does not show the ₹3,000 due')
  await shot(parent, 'parent-dashboard-converted')
  await parent.goto(`${BASE}/parent/dashboard?tab=requests`)
  await parent.getByRole('table').getByRole('button', { name: 'Open' }).click()
  const detail = parent.getByRole('dialog', { name: new RegExp(leadCode) })
  await detail.getByText('+91 9800000001').waitFor() // tutor contact after confirmation
  await shot(parent, 'parent-request-detail')
  await detail.getByRole('radio', { name: '5 stars' }).click()
  await detail.getByRole('button', { name: 'Submit rating' }).click()
  await parent.getByText('Thanks for your feedback.').waitFor()
  await detail.getByRole('button', { name: 'Close', exact: true }).click()
  await shot(parent, 'parent-requests-table')

  // Tutor pauses new leads from the availability screen
  await tutor.goto(`${BASE}/tutor/dashboard?tab=availability`)
  await tutor.getByRole('checkbox', { name: 'Send me new lead offers' }).uncheck()
  await tutor.getByRole('button', { name: 'Save changes' }).click()
  await tutor.getByText('Saved.').waitFor()
  await tutor.goto(`${BASE}/tutor/dashboard`)
  await tutor.getByText('You have paused new leads.').waitFor()
  await shot(tutor, 'tutor-overview-paused')

  // ---------- 8. Admin records the payment ----------
  await admin.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: /Finance/ }).click()
  await admin.getByRole('button', { name: 'Record payment' }).first().click()
  const pay = admin.getByRole('dialog', { name: /Record payment/ })
  await pay.getByLabel('Reference').fill('UPI-REF-001')
  await pay.getByRole('button', { name: 'Record', exact: true }).click()
  await admin.getByText('Payment recorded.').waitFor()
  await shot(admin, 'admin-finance-paid')
  await admin.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: /Audit log/ }).click()
  await admin.getByText('payment.record').waitFor()
  await admin.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: /Matching rules/ }).click()
  await admin.getByLabel('Distance (%)').fill('40')
  await admin.getByText('Total: 110% (must be 100%)').waitFor()
  if (await admin.getByRole('button', { name: 'Save settings' }).isEnabled()) problems.push('Settings can be saved with weights totalling 110%')
  await admin.getByLabel('Experience (%)').fill('0')
  await admin.getByRole('button', { name: 'Save settings' }).click()
  await admin.getByText('Matching rules saved.', { exact: false }).waitFor()
  await shot(admin, 'admin-settings')
  await admin.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: /Operations/ }).click()
  await admin.getByText(/Upcoming demos/).waitFor()
  await shot(admin, 'admin-operations')
  await admin.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: /Overview/ }).click()
  await shot(admin, 'admin-overview')

  await browser.close()
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ leadCode, shots, problems }, null, 2))
  console.log(JSON.stringify({ leadCode, shots: shots.length, problems }, null, 2))
})().catch(async err => {
  for (const [label, page] of openPages) await page.screenshot({ path: path.join(OUT, `FAIL-${label}.png`), fullPage: true }).catch(() => {})
  for (const [label, page] of openPages) console.error(`--- ${label} alerts:`, await page.locator('[role=alert]').allInnerTexts().catch(() => []))
  console.error('WALKTHROUGH FAILED:', err.message)
  console.error(problems.join('\n'))
  process.exit(1)
})
