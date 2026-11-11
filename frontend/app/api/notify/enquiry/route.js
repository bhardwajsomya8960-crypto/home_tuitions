import nodemailer from 'nodemailer'
import { BRAND_NAME } from '@/shared/brand/Logo'
import { levelLabel } from '@/features/website/enquiryLevels'
import { getCity } from '@/features/website/cities/cities.config'
import { CLASS_OPTIONS, MODE_OPTIONS, SUBJECT_OPTIONS, TIME_OPTIONS, labelOf } from '@/features/website/cities/leadOptions'
import { UTM_KEYS } from '@/shared/lib/utm'

// Emails each website callback request to the team's Gmail. It runs on the website's own
// server (a Vercel function) and does not need the backend API, which is not deployed.
// Both the homepage form and the city page forms post here (features/website/api/enquiryApi.js).
// Only known choices are accepted for the city form's options; anything else is left out.
//
// Server-only settings (Vercel → Project → Settings → Environment Variables, or frontend/.env.local):
//   GMAIL_USER          the Gmail address that sends the email, e.g. you@gmail.com
//   GMAIL_APP_PASSWORD  a Google app password for that address (Google Account → App passwords)
//   ENQUIRY_EMAIL_TO    optional: where to send it, comma-separated; defaults to GMAIL_USER
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SORRY = 'We could not send your request right now. Please call or WhatsApp us instead.'
// On a developer's machine the form shows the real reason instead; visitors only see SORRY
// (the reason is in the server log: Vercel → Project → Logs).
const DEV = process.env.NODE_ENV === 'development'
const NOT_SET_UP = 'Email is not set up: add GMAIL_USER and GMAIL_APP_PASSWORD to frontend/.env.local (on Vercel: Settings → Environment Variables, then redeploy).'
const BAD_LOGIN = 'Gmail refused the sign-in. GMAIL_APP_PASSWORD must be a 16-letter app password created for the GMAIL_USER account (Google Account → App passwords), not the normal Gmail password.'

// Trimmed single-line text (newlines would break the subject line), or '' for anything else.
const line = (value, max) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '')
const html = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// Google shows app passwords in groups of four ("abcd efgh ijkl mnop"); spaces are dropped.
const appPassword = () => (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '')

let transport = null
const mailer = () => (transport ||= nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER?.trim(), pass: appPassword() },
}))

export async function POST(request) {
  if (!process.env.GMAIL_USER?.trim() || !appPassword()) {
    console.error(`Enquiry email: ${NOT_SET_UP}`)
    return Response.json({ error: DEV ? NOT_SET_UP : SORRY, code: 'NOT_CONFIGURED' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)
  const phone = line(body?.phone, 10)
  if (!body || !['parent', 'tutor'].includes(body.kind) || !/^[6-9]\d{9}$/.test(phone)) {
    return Response.json({ error: 'Enter a 10-digit mobile number', details: [{ field: 'phone', message: 'Enter a 10-digit mobile number' }] }, { status: 400 })
  }
  // People never see the "website" field; bots fill it in. Say thanks and send nothing.
  if (line(body.website, 200)) return Response.json({ received: true }, { status: 201 })

  const role = body.kind === 'parent' ? ({ parent: 'Parent', student: 'Student' })[body.role] || 'Parent / student' : 'Tutor'
  const name = line(body.name, 80)
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) : ''
  // From the city pages (/noida, /delhi/dwarka, …), or the visitor's own city on /tutors-near-me.
  const city = getCity(line(body.city, 40))
  const cityName = city?.name || line(body.city_name, 40)
  const area = line(body.area, 80)
  const subjects = Array.isArray(body.subjects) ? body.subjects.map(v => labelOf(SUBJECT_OPTIONS, v)).filter(Boolean).join(', ') : ''
  const sourcePage = line(body.source_page, 200)
  const rows = [
    ['Who', role],
    ['Name', name],
    ['Mobile', `+91 ${phone}`],
    ['City', city ? city.name : cityName ? `${cityName} (from the visitor's location or ad link)` : ''],
    ['Area', area],
    ['Location', line(body.location, 100)],
    ['Nearby landmark', line(body.landmark, 100)],
    ['Class', labelOf(CLASS_OPTIONS, body.class_level)],
    ['Subjects', subjects],
    ['Mode', labelOf(MODE_OPTIONS, body.mode)],
    ['Preferred time', labelOf(TIME_OPTIONS, body.preferred_time)],
    ['Female tutor', body.female_tutor === true ? 'Preferred' : ''],
    [body.kind === 'tutor' ? 'Teaches' : 'Tuition for', levelLabel(body.level)],
    ['Course', line(body.courseSlug, 80).replace(/-/g, ' ')],
    ['Message', message],
    ['Sent from', sourcePage.startsWith('/') ? sourcePage : ''],
    ...UTM_KEYS.map(key => [key, line(body[key], 100)]),
    ['Received', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST'],
  ].filter(([, value]) => value)

  const call = `tel:+91${phone}`
  const whatsapp = `https://wa.me/91${phone}`
  const mail = {
    from: `"${BRAND_NAME} website" <${process.env.GMAIL_USER.trim()}>`,
    to: process.env.ENQUIRY_EMAIL_TO?.trim() || process.env.GMAIL_USER.trim(),
    subject: `New ${role.toLowerCase()} enquiry${cityName ? ` (${[cityName, area].filter(Boolean).join(', ')})` : ''}: ${name ? `${name}, ` : ''}+91 ${phone}`,
    text: [...rows.map(([k, v]) => `${k}: ${v}`), '', `Call: ${call}`, `WhatsApp: ${whatsapp}`].join('\n'),
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#26352F">
<h2 style="margin:0 0 12px">New callback request</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="color:#5E7163;vertical-align:top">${html(k)}</td><td style="white-space:pre-wrap"><strong>${html(v)}</strong></td></tr>`).join('')}</table>
<p style="margin-top:16px"><a href="${call}">Call +91 ${phone}</a> &nbsp;·&nbsp; <a href="${whatsapp}">Open in WhatsApp</a></p>
</div>`,
  }

  try {
    await mailer().sendMail(mail)
  } catch (err) {
    transport = null // build a fresh connection next time, in case the settings were fixed
    const reason = err.code === 'EAUTH' ? BAD_LOGIN : `Sending failed: ${err.message}`
    console.error(`Enquiry email failed: ${reason}`)
    return Response.json({ error: DEV ? reason : SORRY, code: 'EMAIL_FAILED' }, { status: 502 })
  }
  return Response.json({ received: true }, { status: 201 })
}
