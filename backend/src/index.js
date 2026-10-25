const { loadEnv } = require('./config/loadEnv')
const envFiles = loadEnv()

const { createApp } = require('./app')
const { readAdminConfig } = require('./config/adminConfig')

const app = createApp()
const PORT = process.env.PORT || 5000
const EXPIRY_SWEEP_MS = 30 * 1000

app.listen(PORT, () => {
  console.log(`Home & Online Tutor Hub API running on port ${PORT}`)
  console.log(envFiles.length ? `Settings loaded from: ${envFiles.join(', ')}` : 'No .env file found; using environment variables only.')
  const admin = readAdminConfig()
  if (!admin.configured) {
    console.warn(`Admin access is disabled:\n  - ${admin.problems.join('\n  - ')}\nRun "npm run setup:admin" in backend/ to create local admin credentials.`)
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
