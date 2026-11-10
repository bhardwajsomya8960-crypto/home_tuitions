// Your public contact details, shown on the website next to the callback form, in the footer
// and in the floating WhatsApp button. Set them in frontend/.env.local (or in Vercel → Settings
// → Environment Variables, or as Docker build arguments in production):
//   NEXT_PUBLIC_CONTACT_PHONE=+91 98765 43210
//   NEXT_PUBLIC_CONTACT_WHATSAPP=919876543210     (country code + number, digits only)
//   NEXT_PUBLIC_CONTACT_EMAIL=hello@example.com
// The phone and email are not shown when left empty. WhatsApp falls back to the business number.
const digits = value => (value || '').replace(/\D/g, '')

const DEFAULT_WHATSAPP = '918960274119'
const whatsappNumber = digits(process.env.NEXT_PUBLIC_CONTACT_WHATSAPP) || DEFAULT_WHATSAPP

// A WhatsApp chat link, optionally with a message already typed in for the visitor to send.
export const whatsappLink = (text = '') => `https://wa.me/${whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export const CONTACT = {
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
  phoneHref: digits(process.env.NEXT_PUBLIC_CONTACT_PHONE) ? `tel:+${digits(process.env.NEXT_PUBLIC_CONTACT_PHONE).replace(/^(?!91)/, '91')}` : '',
  whatsappHref: whatsappLink(),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
}

export const hasContact = Boolean(CONTACT.phone || CONTACT.whatsappHref || CONTACT.email)
