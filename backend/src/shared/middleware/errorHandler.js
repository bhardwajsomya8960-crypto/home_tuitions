const { AppError } = require('../errors')

// Stable JSON error shape: { error, code, details? }. No stack traces or internal messages.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON', code: 'INVALID_JSON' })
  }
  if (err instanceof AppError) {
    const body = { error: err.message, code: err.code }
    if (err.details) body.details = err.details
    return res.status(err.status).json(body)
  }
  // A unique index refused the write (for example two registrations with one phone at once).
  if (err && err.code === 11000) {
    return res.status(409).json({ error: 'This record already exists', code: 'DUPLICATE' })
  }
  console.error(err)
  return res.status(500).json({ error: 'Something went wrong', code: 'INTERNAL' })
}

function notFound(req, res) {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' })
}

module.exports = { errorHandler, notFound }
