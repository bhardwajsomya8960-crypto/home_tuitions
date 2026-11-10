// Your public business details (name, area, phone, email, profiles): the footer's NAP line,
// the callback form, the WhatsApp button and the structured data for search engines all read
// them from here, so they are identical everywhere. Set them in frontend/.env.local (or in
// Vercel → Settings → Environment Variables), or edit the defaults below:
//   NEXT_PUBLIC_CONTACT_PHONE=+91 98765 43210
//   NEXT_PUBLIC_CONTACT_WHATSAPP=919876543210     (country code + number, digits only)
//   NEXT_PUBLIC_CONTACT_EMAIL=hello@example.com
//   NEXT_PUBLIC_GBP_URL=https://g.page/...        (Google Business Profile)
//   NEXT_PUBLIC_FACEBOOK_URL=https://www.facebook.com/...
//   NEXT_PUBLIC_JUSTDIAL_URL=https://www.justdial.com/...
// The phone and WhatsApp number fall back to the business number; the email and the profile
// links are left out wherever they are empty.
const digits = value => (value || '').replace(/\D/g, '')

const DEFAULT_PHONE = '+91 89602 74119'
const DEFAULT_WHATSAPP = '918960274119'
const DEFAULT_EMAIL = '' // TODO(email): the public business email, if you want one shown in the footer
const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || DEFAULT_PHONE
const whatsappNumber = digits(process.env.NEXT_PUBLIC_CONTACT_WHATSAPP) || DEFAULT_WHATSAPP

// A WhatsApp chat link, optionally with a message already typed in for the visitor to send.
export const whatsappLink = (text = '') => `https://wa.me/${whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export const CONTACT = {
  phone,
  // E.164 form (+918960274119) for structured data.
  phoneE164: `+${digits(phone).replace(/^(?!91)/, '91')}`,
  // Tapping it starts a call on phones (and opens the calling app on computers).
  phoneHref: `tel:+${digits(phone).replace(/^(?!91)/, '91')}`,
  whatsappHref: whatsappLink(),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || DEFAULT_EMAIL,
}

// The "A" of NAP: where we work. Shown in the footer on every page.
export const SERVICE_AREA = 'Noida & Delhi NCR'

// Official profiles (schema.org sameAs). TODO(profiles): set the env vars, or fill in here.
export const SOCIAL_PROFILES = [
  process.env.NEXT_PUBLIC_GBP_URL || '',
  process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
  process.env.NEXT_PUBLIC_JUSTDIAL_URL || '',
].filter(url => /^https:\/\//.test(url))

export const hasContact = Boolean(CONTACT.phone || CONTACT.whatsappHref || CONTACT.email)
