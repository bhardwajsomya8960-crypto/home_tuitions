const crypto = require('crypto')

// Time-ordered UUIDs (version 7 layout): the first 48 bits are the creation time in ms, then a
// counter, so ids created later always sort after earlier ones, even within one millisecond.
// Lists sorted by createdAt use the id as a tie-breaker, which keeps creation order stable.
let lastMs = 0
let counter = 0

function newId() {
  let ms = Date.now()
  if (ms <= lastMs) {
    counter = (counter + 1) & 0xfff
    if (counter === 0) lastMs += 1
    ms = lastMs
  } else {
    lastMs = ms
    counter = crypto.randomInt(0, 0x800)
  }
  const bytes = crypto.randomBytes(16)
  bytes.writeUIntBE(ms, 0, 6)
  bytes[6] = 0x70 | (counter >> 8)
  bytes[7] = counter & 0xff
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

module.exports = { newId }
