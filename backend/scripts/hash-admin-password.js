// Prints a bcrypt hash for ADMIN_PASSWORD_HASH. The password is read from stdin so it does not
// appear in shell history or process listings:
//
//   printf '%s' 'your-password' | node scripts/hash-admin-password.js
//
const bcrypt = require('bcryptjs')

let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => { input += chunk })
process.stdin.on('end', () => {
  const password = input.replace(/\r?\n$/, '')
  if (password.length < 12) {
    console.error('Use a password of at least 12 characters.')
    process.exit(1)
  }
  console.log(bcrypt.hashSync(password, 12))
})
