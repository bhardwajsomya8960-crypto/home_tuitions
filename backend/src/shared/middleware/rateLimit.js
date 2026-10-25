const { AppError } = require('../errors')

// Limits how often one client (by IP address) may call a public route, for example the website
// enquiry form. Counts are kept in memory per process, which is enough to stop casual abuse;
// put a stricter limit at the proxy for heavier protection.
function rateLimit({ max, windowMs, message = 'Too many requests. Please try again later.', now = () => Date.now() }) {
  const hits = new Map()
  return (req, res, next) => {
    const t = now()
    const key = req.ip
    let entry = hits.get(key)
    if (!entry || t - entry.start >= windowMs) {
      entry = { start: t, count: 0 }
      hits.set(key, entry)
    }
    entry.count += 1
    if (hits.size > 10000) for (const [k, e] of hits) if (t - e.start >= windowMs) hits.delete(k)
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.start + windowMs - t) / 1000)))
      return next(new AppError(429, 'RATE_LIMITED', message))
    }
    return next()
  }
}

module.exports = { rateLimit }
