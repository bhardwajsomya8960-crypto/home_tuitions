// Registration consent rules shared by parents and tutors.
function consentErrors(consent, { location }) {
  const errors = []
  if (!consent || consent.terms !== true) errors.push({ field: 'consent.terms', message: 'You must accept the terms and privacy policy' })
  if (!consent || consent.communication !== true) errors.push({ field: 'consent.communication', message: 'We need your permission to contact you about this request' })
  if (location && (!consent || consent.location !== true)) errors.push({ field: 'consent.location', message: 'Location consent is required when sharing your location' })
  return errors
}

module.exports = { consentErrors }
