const { AppError } = require('../../../shared/errors')
const { sendStoredFile } = require('../../../shared/http')

// KYC documents: upload, remove (until accepted) and view the tutor's own files.
function createDocumentsController({ services }) {
  const { documents } = services
  return {
    upload: req => documents.upload(req.user.id, req.body?.type, req.file, { title: req.body?.title, description: req.body?.description }),
    remove: req => documents.remove(req.user.id, req.params.docId),
    async file(req, res) {
      const opened = await documents.open(req.params.docId)
      if (opened.doc.tutorId !== req.user.id) {
        opened.stream.destroy?.()
        throw new AppError(404, 'NOT_FOUND', 'Document not found')
      }
      sendStoredFile(res, opened)
    },
  }
}

module.exports = { createDocumentsController }
