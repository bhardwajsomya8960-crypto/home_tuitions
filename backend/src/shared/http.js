const { asyncHandler } = require('./middleware/asyncHandler')

// Route helpers: a controller returns data and these send it as JSON with the right status.
const json = fn => asyncHandler(async (req, res) => res.json(await fn(req, res)))
const created = fn => asyncHandler(async (req, res) => res.status(201).json(await fn(req, res)))
const noContent = fn => asyncHandler(async (req, res) => { await fn(req, res); res.status(204).end() })

// Streams a stored file (S3 or disk). Private: never cached by browsers or proxies.
function sendStoredFile(res, { doc, stream }) {
  res.type(doc.mimeType)
  res.set('Cache-Control', 'no-store')
  res.set('Content-Disposition', `inline; filename="${encodeURIComponent(doc.originalName)}"`)
  stream.on('error', err => {
    console.error('File stream failed', err.message)
    if (!res.headersSent) res.status(500).json({ error: 'Could not read the file', code: 'FILE_READ_FAILED' })
    else res.destroy()
  })
  stream.pipe(res)
}

module.exports = { json, created, noContent, sendStoredFile }
