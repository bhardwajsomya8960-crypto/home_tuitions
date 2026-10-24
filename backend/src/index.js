const dotenv = require('dotenv')
dotenv.config()

const { createApp } = require('./app')
const { readAdminConfig } = require('./config/adminConfig')

const app = createApp()
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`home tution API running on port ${PORT}`)
  if (!readAdminConfig().configured) {
    console.warn('Admin access is disabled: set ADMIN_EMAIL, ADMIN_PASSWORD_HASH and ADMIN_JWT_SECRET to enable it.')
  }
})

module.exports = app
