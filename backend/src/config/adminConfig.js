// Server-side admin configuration, read from environment variables only.
// No credentials or secrets live in the repository.
const MIN_SECRET_LENGTH = 32

function readAdminConfig(env = process.env) {
  const problems = []
  const email = (env.ADMIN_EMAIL || '').trim().toLowerCase()
  const passwordHash = env.ADMIN_PASSWORD_HASH || ''
  const secret = env.ADMIN_JWT_SECRET || ''
  const ttl = env.ADMIN_TOKEN_TTL || '8h'

  if (!email) problems.push('ADMIN_EMAIL is not set')
  if (!/^\$2[aby]\$\d{2}\$.{53}$/.test(passwordHash)) problems.push('ADMIN_PASSWORD_HASH must be a bcrypt hash')
  if (secret.length < MIN_SECRET_LENGTH) problems.push(`ADMIN_JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`)
  if (secret && secret === env.JWT_SECRET) problems.push('ADMIN_JWT_SECRET must differ from JWT_SECRET')

  return {
    configured: problems.length === 0,
    problems,
    email,
    passwordHash,
    secret,
    ttl,
  }
}

module.exports = { readAdminConfig, MIN_SECRET_LENGTH }
