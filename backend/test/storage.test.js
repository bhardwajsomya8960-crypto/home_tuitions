const { test } = require('node:test')
const assert = require('node:assert/strict')
const { Readable } = require('stream')
const { createStorage } = require('../src/services/storage')
const { createS3Storage } = require('../src/services/storage/s3.storage')

test('storage driver is chosen from the environment', () => {
  assert.equal(createStorage({ UPLOADS_DIR: '/tmp/x' }).driver, 'local')
  assert.equal(createStorage({ S3_BUCKET: 'b', AWS_REGION: 'ap-south-1' }).driver, 's3')
  assert.throws(() => createStorage({ STORAGE_DRIVER: 's3' }), /S3_BUCKET and AWS_REGION/)
  assert.throws(() => createStorage({ STORAGE_DRIVER: 'ftp' }), /Unknown STORAGE_DRIVER/)
})

test('S3 files are private, encrypted and kept under a prefix', async () => {
  const sent = []
  const client = {
    async send(command) {
      sent.push({ name: command.constructor.name, input: command.input })
      return command.constructor.name === 'GetObjectCommand' ? { Body: Readable.from(['file']) } : {}
    },
  }
  const storage = createS3Storage({ bucket: 'kyc-bucket', region: 'ap-south-1', prefix: 'tutor-documents/', client })
  await storage.put('t1/doc.pdf', Buffer.from('%PDF'), 'application/pdf')
  const stream = await storage.open('t1/doc.pdf')
  let body = ''
  for await (const chunk of stream) body += chunk
  await storage.remove('t1/doc.pdf')

  assert.deepEqual(sent.map(s => s.name), ['PutObjectCommand', 'GetObjectCommand', 'DeleteObjectCommand'])
  assert.equal(sent[0].input.Bucket, 'kyc-bucket')
  assert.equal(sent[0].input.Key, 'tutor-documents/t1/doc.pdf')
  assert.equal(sent[0].input.ServerSideEncryption, 'AES256')
  assert.equal(sent[0].input.ACL, undefined, 'never public')
  assert.equal(body, 'file')
})
