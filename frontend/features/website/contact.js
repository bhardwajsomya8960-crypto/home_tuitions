// Your public contact details, shown on the website next to the callback form and in the footer.
// Set them in frontend/.env.local (or as Docker build arguments in production):
//   NEXT_PUBLIC_CONTACT_PHONE=+91 98765 43210
//   NEXT_PUBLIC_CONTACT_WHATSAPP=919876543210     (country code + number, digits only)
//   NEXT_PUBLIC_CONTACT_EMAIL=hello@example.com
// Anything left empty is simply not shown.
const digits = value => (value || '').replace(/\D/g, '')

export const CONTACT = {
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '',
  phoneHref: digits(process.env.NEXT_PUBLIC_CONTACT_PHONE) ? `tel:+${digits(process.env.NEXT_PUBLIC_CONTACT_PHONE).replace(/^(?!91)/, '91')}` : '',
  whatsappHref: digits(process.env.NEXT_PUBLIC_CONTACT_WHATSAPP) ? `https://wa.me/${digits(process.env.NEXT_PUBLIC_CONTACT_WHATSAPP)}` : '',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
}

export const hasContact = Boolean(CONTACT.phone || CONTACT.whatsappHref || CONTACT.email)
