const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')

// Files in a private S3 bucket, encrypted at rest. Nothing is public: the API checks who is
// asking and streams the file. Credentials come from the EC2 instance role (recommended) or the
// usual AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY variables.
function createS3Storage({ bucket, region, prefix = '', client }) {
  const s3 = client || new S3Client({ region })
  const keyFor = key => `${prefix}${key}`
  return {
    driver: 's3',
    async put(key, buffer, contentType) {
      await s3.send(new PutObjectCommand({
        Bucket: bucket, Key: keyFor(key), Body: buffer, ContentType: contentType, ServerSideEncryption: 'AES256',
      }))
    },
    async open(key) {
      const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: keyFor(key) }))
      return res.Body
    },
    async remove(key) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: keyFor(key) }))
    },
  }
}

module.exports = { createS3Storage }
