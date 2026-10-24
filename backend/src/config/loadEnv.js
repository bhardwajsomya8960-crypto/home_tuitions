// Loads environment files so the server and scripts see the same settings no matter which
// folder they are started from. The setup guide puts settings in the repository-root
// .env.local; backend/.env is also read. Earlier files win, and real environment variables
// always win over files.
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const ROOT = path.join(__dirname, '..', '..', '..')
const BACKEND = path.join(__dirname, '..', '..')
const CANDIDATES = [
  path.join(ROOT, '.env.local'),
  path.join(ROOT, '.env'),
  path.join(BACKEND, '.env.local'),
  path.join(BACKEND, '.env'),
]

function loadEnv() {
  const loaded = CANDIDATES.filter(file => fs.existsSync(file))
  for (const file of loaded) dotenv.config({ path: file })
  return loaded
}

module.exports = { loadEnv, ROOT_ENV_LOCAL: CANDIDATES[0] }
