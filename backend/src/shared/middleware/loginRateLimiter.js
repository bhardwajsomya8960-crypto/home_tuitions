// Counts failed admin logins per key (client IP and account). Once a key reaches the limit it
// is locked for `lockMs`. State is in memory: it resets on restart and is per process, so
// production should also rate-limit at the reverse proxy.
class FailureLimiter {
  constructor({ max = 10, windowMs = 15 * 60 * 1000, lockMs = 15 * 60 * 1000, now = () => Date.now() } = {}) {
    this.max = max
    this.windowMs = windowMs
    this.lockMs = lockMs
    this.now = now
    this.entries = new Map()
  }

  // Returns the number of seconds until the key may try again, or 0 if allowed.
  retryAfter(key) {
    const entry = this.entries.get(key)
    if (!entry) return 0
    const t = this.now()
    if (entry.lockedUntil && entry.lockedUntil > t) return Math.ceil((entry.lockedUntil - t) / 1000)
    if (entry.lockedUntil && entry.lockedUntil <= t) this.entries.delete(key)
    return 0
  }

  recordFailure(key) {
    const t = this.now()
    let entry = this.entries.get(key)
    if (!entry || t - entry.firstAt > this.windowMs) {
      entry = { count: 0, firstAt: t, lockedUntil: 0 }
      this.entries.set(key, entry)
    }
    entry.count += 1
    if (entry.count >= this.max) entry.lockedUntil = t + this.lockMs
  }

  reset(key) {
    this.entries.delete(key)
  }
}

module.exports = { FailureLimiter }
