const { loadEnv } = require('./config/env')
const envFiles = loadEnv()

const { connect, disconnect } = require('./db/connection')
const { createApp } = require('./app')
const { readAdminConfig } = require('./config/adminConfig')
const { startOfferExpiryJob } = require('./jobs/offerExpiry.job')

const PORT = process.env.PORT || 5000

async function main() {
  console.log(envFiles.length ? `Settings loaded from: ${envFiles.join(', ')}` : 'No .env file found; using environment variables only.')
  await connect()
  const app = createApp()
  const server = app.listen(PORT, () => {
    console.log(`Home & Online Tutor Hub API running on port ${PORT}`)
    const admin = readAdminConfig()
    if (!admin.configured) {
      console.warn(`Admin access is disabled:\n  - ${admin.problems.join('\n  - ')}\nRun "npm run setup:admin" in backend/ to create local admin credentials.`)
    }
  })
  const stopJob = startOfferExpiryJob(app.locals.services)

  // Finish in-flight requests on shutdown (deploys, instance restarts).
  const shutdown = signal => {
    console.log(`${signal} received, shutting down`)
    stopJob()
    server.close(async () => {
      await disconnect()
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main().catch(err => {
  console.error('Could not start the API:', err.message)
  process.exit(1)
})
