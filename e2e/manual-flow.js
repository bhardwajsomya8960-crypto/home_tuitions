// End-to-end UI check of the manual operations flow: a visitor sends the callback form on the
// website (phone only), staff see it in Enquiries, call back, turn it into a parent and tuition
// request, add a tutor who sent their details on WhatsApp, upload a document for them, and assign
// that tutor by hand. Runs against the same servers as walkthrough.js (see e2e/README.md).
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3055'
const OUT = process.env.E2E_OUT_DIR || path.join(__dirname, 'output', 'manual')
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

// Distinct numbers so this can run after walkthrough.js on the same database.
const PARENT_PHONE = '9811100001'
const TUTOR_PHONE = '9811100002'

;(async () => {
  const browser = await chromium.launch()

  // ---------- 1. Visitors send the callback form (no sign-in) ----------
  const site = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage(); watch(site, 'website')
  await site.goto(`${BASE}/`)
  await site.getByRole('link', { name: 'Find My Tutor' }).first().click()
  const form = site.locator('#enquire')
  await form.getByRole('button', { name: 'Request a callback' }).click()
  await form.getByText(/10-digit/).first().waitFor()
  await form.getByLabel('Mobile number').fill(PARENT_PHONE)
  await form.getByLabel('Looking for tuition in').selectOption('school')
  await shot(site, 'website-form')
  await form.getByRole('button', { name: 'Request a callback' }).click()
  await form.getByText(`+91 ${PARENT_PHONE}`).waitFor()
  if (!site.url().startsWith(`${BASE}/`) || /login|register/.test(site.url())) problems.push(`Website form redirected to ${site.url()}`)
  await shot(site, 'website-thanks')

  await form.getByRole('button', { name: 'Send another request' }).click()
  await form.getByRole('tab', { name: 'I want to teach' }).click()
  await form.getByLabel('Mobile number').fill(TUTOR_PHONE)
  await form.getByLabel('Name').fill('Ravi Kumar')
  await form.getByLabel('I teach').selectOption('competitive')
  await form.getByRole('button', { name: 'Request a callback' }).click()
  await form.getByText(`+91 ${TUTOR_PHONE}`).waitFor()

  // ---------- 2. Staff see both in Enquiries ----------
  const admin = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage(); watch(admin, 'admin')
  await admin.goto(`${BASE}/admin/login`)
  await admin.getByLabel('Email').fill(ADMIN_EMAIL)
  await admin.getByLabel('Password').fill(ADMIN_PASSWORD)
  await admin.getByRole('button', { name: 'Sign in' }).click()
  await admin.getByText('Lead pipeline').waitFor()
  const nav = name => admin.getByRole('navigation', { name: 'Main' }).getByRole('button', { name })
  await nav(/Enquiries/).click()
  await admin.getByRole('link', { name: PARENT_PHONE }).waitFor()
  await shot(admin, 'admin-enquiries')

  // ---------- 3. Call back the parent, note it, create parent + request ----------
  await admin.getByRole('row', { name: new RegExp(PARENT_PHONE) }).getByRole('button', { name: 'Open' }).click()
  let dialog = admin.getByRole('dialog', { name: `Enquiry from +91 ${PARENT_PHONE}` })
  await dialog.getByLabel('Add a note').fill('Called back. Needs maths for Class 8, online, evenings.')
  await dialog.getByRole('button', { name: 'Save note' }).click()
  await dialog.getByText('Called back. Needs maths').waitFor()
  await dialog.getByRole('button', { name: 'Mark as contacted' }).click()
  await dialog.getByRole('button', { name: 'Close enquiry' }).waitFor()
  await shot(admin, 'admin-enquiry-detail')
  await dialog.getByRole('button', { name: 'Create parent and tuition request' }).click()

  dialog = admin.getByRole('dialog', { name: 'New tuition request from enquiry' })
  if (await dialog.getByLabel('Mobile').inputValue() !== PARENT_PHONE) problems.push('Lead form not prefilled with the enquiry phone')
  if (!/Playgroup to Class 12/.test(await dialog.getByLabel('Call note').inputValue())) problems.push('Lead form note missing the enquiry level')
  await dialog.getByLabel('Parent name').fill('Meena Sharma')
  await dialog.getByLabel('Student name').fill('Arjun')
  await dialog.getByRole('combobox', { name: 'Class', exact: true }).selectOption('8')
  await dialog.getByLabel('Board').selectOption('CBSE')
  await dialog.getByRole('group', { name: 'Subjects', exact: true }).getByRole('checkbox', { name: 'Mathematics' }).click()
  await dialog.getByLabel('Mode').selectOption('online')
  await dialog.getByRole('group', { name: 'Days', exact: true }).getByRole('checkbox', { name: 'Tue' }).click()
  await dialog.getByRole('group', { name: 'Times', exact: true }).getByRole('checkbox').first().click()
  await shot(admin, 'admin-lead-from-enquiry')
  await dialog.getByRole('button', { name: /Create/ }).click()
  const leadDialog = admin.getByRole('dialog', { name: /HT-L-/ })
  await leadDialog.waitFor()
  const leadTitle = await leadDialog.getByRole('heading').first().textContent()
  await leadDialog.getByRole('button', { name: 'Close', exact: true }).click()

  await nav(/Enquiries/).click()
  await admin.getByRole('row', { name: new RegExp(PARENT_PHONE) }).getByText('Converted').waitFor()

  // ---------- 4. Parents tab: second child added by hand ----------
  await nav(/Parents/).click()
  await admin.getByRole('row', { name: /Meena Sharma/ }).getByRole('button').first().click()
  dialog = admin.getByRole('dialog', { name: 'Meena Sharma' })
  await dialog.getByText('Arjun', { exact: true }).waitFor()
  await dialog.getByRole('button', { name: 'Add student' }).click()
  const add = admin.getByRole('dialog', { name: 'Add student' })
  await add.getByLabel('Student name').fill('Kavya')
  await add.getByLabel('Class').selectOption('5')
  await add.getByLabel('Board').selectOption('CBSE')
  await add.getByRole('button', { name: 'Add student' }).click()
  await dialog.getByText('Kavya', { exact: true }).waitFor()
  await shot(admin, 'admin-parent-detail')
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()

  // ---------- 5. Tutor enquiry → tutor profile → document upload ----------
  await nav(/Enquiries/).click()
  await admin.getByRole('row', { name: new RegExp(TUTOR_PHONE) }).getByRole('button', { name: 'Open' }).click()
  await admin.getByRole('dialog', { name: 'Enquiry from Ravi Kumar' }).getByRole('button', { name: 'Create tutor profile' }).click()
  dialog = admin.getByRole('dialog', { name: 'New tutor' })
  if (await dialog.getByLabel('Name').inputValue() !== 'Ravi Kumar') problems.push('Tutor form not prefilled with the enquiry name')
  const group = name => dialog.getByRole('group', { name, exact: true })
  await dialog.getByRole('radio', { name: 'Male', exact: true }).click()
  await group('Subjects').getByRole('checkbox', { name: 'Mathematics' }).click()
  await group('Classes').getByRole('checkbox', { name: 'Class 8', exact: true }).click()
  await group('Teaching mode').getByRole('checkbox', { name: 'Online' }).click()
  await shot(admin, 'admin-new-tutor')
  await dialog.getByRole('button', { name: 'Create tutor' }).click()
  const review = admin.getByRole('dialog', { name: /Ravi Kumar/ })
  await review.getByText('Upload a document for this tutor').waitFor()
  // The tutor sent their photo, ID and degree on WhatsApp: staff upload each one.
  const pdf = path.join(OUT, 'sample.pdf')
  fs.writeFileSync(pdf, '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
  const png = path.join(OUT, 'sample.png')
  fs.writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'))
  for (const [type, title, file] of [['photo', null, png], ['identity', 'Aadhaar card', pdf], ['qualification', 'B.Sc degree', pdf]]) {
    await review.getByLabel('Document').selectOption(type)
    if (title) await review.getByLabel('Name', { exact: true }).fill(title)
    await review.getByLabel('File').setInputFiles(file)
    await review.getByRole('button', { name: 'Upload', exact: true }).click()
    // The form clears itself once the upload has finished.
    while (await review.getByLabel('Document').inputValue() !== '') await admin.waitForTimeout(100)
    await review.getByText('Document uploaded.', { exact: false }).waitFor()
  }
  await review.getByText('Aadhaar card').first().waitFor()
  for (let i = 0; i < 3; i++) {
    await review.getByRole('button', { name: 'Accept', exact: true }).first().click()
    await review.getByText(/accepted\./).waitFor()
  }
  await review.getByRole('button', { name: 'Verify', exact: true }).click()
  await review.getByText('Verify: done.').waitFor()
  await review.getByRole('button', { name: 'Activate', exact: true }).click()
  await review.getByText('Activate: done.').waitFor()
  await shot(admin, 'admin-tutor-upload')
  await review.getByRole('button', { name: 'Close', exact: true }).click()

  // ---------- 6. Assign the tutor to the request by hand ----------
  await nav(/Leads/).click()
  const code = leadTitle.match(/HT-L-\d+/)[0]
  await admin.getByRole('button', { name: code }).click()
  const lead = admin.getByRole('dialog', { name: new RegExp(code) })
  await lead.getByRole('searchbox', { name: 'Search tutors' }).fill('Ravi')
  await lead.getByRole('button', { name: 'Assign now' }).first().click()
  const assign = admin.getByRole('dialog', { name: 'Assign Ravi Kumar' })
  await assign.getByLabel('Reason').fill('Agreed on the phone with the parent and the tutor')
  await assign.getByRole('button', { name: 'Assign and confirm' }).click()
  await lead.getByText('Tutor assigned and confirmed.', { exact: false }).waitFor()
  await shot(admin, 'admin-manual-assign')

  await browser.close()
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ code, shots, problems }, null, 2))
  console.log(JSON.stringify({ code, shots: shots.length, problems }, null, 2))
  if (problems.length) process.exit(1)
})().catch(async err => {
  for (const [label, page] of openPages) await page.screenshot({ path: path.join(OUT, `FAIL-${label}.png`), fullPage: true }).catch(() => {})
  for (const [label, page] of openPages) console.error(`--- ${label} alerts:`, await page.locator('[role=alert]').allInnerTexts().catch(() => []))
  console.error('MANUAL FLOW FAILED:', err.message)
  console.error(problems.join('\n'))
  process.exit(1)
})
