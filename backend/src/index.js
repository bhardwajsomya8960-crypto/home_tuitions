const dotenv = require('dotenv')
dotenv.config()

const { createApp } = require('./app')
const { readAdminConfig } = require('./config/adminConfig')

const app = createApp()
const PORT = process.env.PORT || 5000
const EXPIRY_SWEEP_MS = 30 * 1000

app.listen(PORT, () => {
  console.log(`home tution API running on port ${PORT}`)
  if (!readAdminConfig().configured) {
    console.warn('Admin access is disabled: set ADMIN_EMAIL, ADMIN_PASSWORD_HASH and ADMIN_JWT_SECRET to enable it.')
  }
})

// Expired tutor offers move to the next tutor even when nobody is using the app. Offers are
// also expired on every read, so a missed sweep only delays the next offer.
setInterval(() => {
  try {
    app.locals.operationsService.assignments.expireOffers()
  } catch (err) {
    console.error('Offer expiry sweep failed:', err)
  }
}, EXPIRY_SWEEP_MS).unref()

module.exports = app
