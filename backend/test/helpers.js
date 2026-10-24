const bcrypt = require('bcryptjs')
const os = require('os')
const path = require('path')
const fs = require('fs')

const ADMIN_EMAIL = 'admin@test.local'
const ADMIN_PASSWORD = 'correct-horse-battery'
const ADMIN_SECRET = 'a'.repeat(40)

// Sets admin configuration for the test process. Must run before the app is required.
function configureAdminEnv() {
  process.env.ADMIN_EMAIL = ADMIN_EMAIL
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 4)
  process.env.ADMIN_JWT_SECRET = ADMIN_SECRET
  process.env.ADMIN_TOKEN_TTL = '1h'
  process.env.JWT_SECRET = 'b'.repeat(40)
}

function tempDbPath(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalogue-test-'))
  return path.join(dir, `${name}.sqlite`)
}

// Starts the app on an ephemeral port and returns a small JSON client.
async function startServer(app) {
  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s))
  })
  const { port } = server.address()
  const base = `http://127.0.0.1:${port}`

  async function request(method, url, { body, token, headers = {} } = {}) {
    const res = await fetch(base + url, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    let json = null
    try { json = text ? JSON.parse(text) : null } catch { json = text }
    return { status: res.status, body: json, headers: res.headers }
  }

  return { base, request, close: () => new Promise(r => server.close(r)) }
}

module.exports = { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SECRET, configureAdminEnv, tempDbPath, startServer }
