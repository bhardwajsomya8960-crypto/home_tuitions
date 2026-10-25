const multer = require('multer')
const { AppError } = require('../errors')

// Reads one uploaded file into memory (the service checks it and sends it to storage).
// `field` is the form field holding the file; up to `fields` other text fields are allowed.
function singleUpload(field, { maxBytes, fields = 4 }) {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxBytes, files: 1, fields, fieldSize: 2048 } })
  return (req, res, next) => upload.single(field)(req, res, err => {
    if (err && err.code === 'LIMIT_FILE_SIZE') return next(new AppError(413, 'FILE_TOO_LARGE', `Files must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller`))
    if (err) return next(new AppError(400, 'UPLOAD_FAILED', 'The upload could not be read'))
    return next()
  })
}

module.exports = { singleUpload }
