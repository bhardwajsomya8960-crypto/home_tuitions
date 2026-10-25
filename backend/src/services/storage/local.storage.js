const fs = require('fs')
const path = require('path')

// Files on local disk. For development and tests only: an EC2 disk is lost with the machine and
// is not shared between servers, so production uses S3.
function createLocalStorage({ dir }) {
  const fileFor = key => path.join(dir, path.basename(key))
  return {
    driver: 'local',
    async put(key, buffer) {
      await fs.promises.mkdir(dir, { recursive: true })
      await fs.promises.writeFile(fileFor(key), buffer, { mode: 0o600 })
    },
    async open(key) {
      const file = fileFor(key)
      await fs.promises.access(file)
      return fs.createReadStream(file)
    },
    async remove(key) {
      await fs.promises.rm(fileFor(key), { force: true })
    },
  }
}

module.exports = { createLocalStorage }
