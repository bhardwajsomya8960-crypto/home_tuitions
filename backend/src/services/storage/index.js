const path = require('path')
const { createLocalStorage } = require('./local.storage')
const { createS3Storage } = require('./s3.storage')

const DEFAULT_UPLOADS = path.join(__dirname, '..', '..', '..', 'data', 'uploads')

// Picks where uploaded files (tutor KYC documents) are kept:
//   STORAGE_DRIVER=s3 with S3_BUCKET and AWS_REGION (production), or
//   STORAGE_DRIVER=local with UPLOADS_DIR (development; the default).
// Every driver has the same methods: put(key, buffer, contentType), open(key) -> readable
// stream, remove(key).
function createStorage(env = process.env) {
  const driver = env.STORAGE_DRIVER || (env.S3_BUCKET ? 's3' : 'local')
  if (driver === 's3') {
    if (!env.S3_BUCKET || !env.AWS_REGION) throw new Error('STORAGE_DRIVER=s3 needs S3_BUCKET and AWS_REGION')
    return createS3Storage({ bucket: env.S3_BUCKET, region: env.AWS_REGION, prefix: env.S3_PREFIX || 'tutor-documents/' })
  }
  if (driver !== 'local') throw new Error(`Unknown STORAGE_DRIVER "${driver}" (use local or s3)`)
  return createLocalStorage({ dir: env.UPLOADS_DIR || DEFAULT_UPLOADS })
}

module.exports = { createStorage }
