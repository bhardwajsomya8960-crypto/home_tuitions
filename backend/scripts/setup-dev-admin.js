// Creates or updates local admin sign-in settings in the repository-root .env.local.
//
//   npm run setup:admin -- admin@example.com          (asks for the password)
//   printf '%s' 'a-long-password' | npm run setup:admin -- admin@example.com
//
// It stores a bcrypt hash (never the password), generates ADMIN_JWT_SECRET and JWT_SECRET when
// they are missing or too short, and keeps every other line of the file. Development only.
const fs = require('fs')
const crypto = require('crypto')
const readline = require('readline')
const bcrypt = require('bcryptjs')
const { ROOT_ENV_LOCAL } = require('../src/config/loadEnv')
const { MIN_SECRET_LENGTH } = require('../src/config/adminConfig')

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run with NODE_ENV=production. Set production secrets in your hosting environment.')
  process.exit(1)
}

const email = (process.argv[2] || '').trim().toLowerCase()
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run setup:admin -- you@example.com')
  process.exit(1)
}

function readPassword() {
  if (!process.stdin.isTTY) {
    return new Promise(resolve => {
      let input = ''
      process.stdin.setEncoding('utf8')
      process.stdin.on('data', c => { input += c })
      process.stdin.on('end', () => resolve(input.replace(/\r?\n$/, '')))
    })
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  rl._writeToOutput = text => { if (!rl.muted) rl.output.write(text) }
  return new Promise(resolve => {
    rl.question('Admin password (12+ characters): ', answer => { rl.close(); process.stdout.write('\n'); resolve(answer) })
    rl.muted = true
  })
}

// Parses KEY=value lines, keeping the original lines so comments and order survive.
function readEnvFile(file) {
  const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/) : []
  const values = {}
  for (const line of lines) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (m) values[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return { lines, values }
}

function setKey(lines, key, value) {
  const line = `${key}=${value}`
  const index = lines.findIndex(l => new RegExp(`^\\s*${key}\\s*=`).test(l))
  if (index >= 0) lines[index] = line
  else lines.push(line)
}

;(async () => {
  const password = await readPassword()
  if (password.length < 12) {
    console.error('Use a password of at least 12 characters.')
    process.exit(1)
  }

  const { lines, values } = readEnvFile(ROOT_ENV_LOCAL)
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
  const randomSecret = () => crypto.randomBytes(32).toString('hex')

  let jwtSecret = values.JWT_SECRET || ''
  if (jwtSecret.length < 32 || jwtSecret.includes('change-in-production')) jwtSecret = randomSecret()
  let adminSecret = values.ADMIN_JWT_SECRET || ''
  if (adminSecret.length < MIN_SECRET_LENGTH || adminSecret === jwtSecret || adminSecret.startsWith('replace-with')) adminSecret = randomSecret()

  setKey(lines, 'ADMIN_EMAIL', email)
  // Single quotes keep the $ signs in the bcrypt hash literal for shells that source this file.
  setKey(lines, 'ADMIN_PASSWORD_HASH', `'${bcrypt.hashSync(password, 12)}'`)
  setKey(lines, 'ADMIN_JWT_SECRET', adminSecret)
  setKey(lines, 'JWT_SECRET', jwtSecret)
  if (!('OTP_DEV_ECHO' in values)) setKey(lines, 'OTP_DEV_ECHO', 'true')

  const text = `${lines.join('\n').replace(/\n+$/, '')}\n`
  fs.writeFileSync(ROOT_ENV_LOCAL, text, { mode: 0o600 })
  console.log(`Admin sign-in saved to ${ROOT_ENV_LOCAL} for ${email}. Restart the API to use it.`)
})()
