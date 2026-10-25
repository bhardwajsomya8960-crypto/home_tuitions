const { sendStoredFile } = require('../../../shared/http')

const ACTOR = 'admin'

// Tutor lists, the review screen, KYC document checks and account actions.
function createTutorsController({ services }) {
  const { tutorAdmin, documents, ctx } = services
  return {
    list: req => tutorAdmin.listTutors(req.query),
    detail: req => tutorAdmin.tutorDetail(req.params.id),
    action: req => tutorAdmin.tutorAction(req.params.id, req.body, ACTOR),
    reviewDocument: req => tutorAdmin.reviewDocument(req.params.id, req.body, ACTOR),
    // Every staff view of a KYC file is recorded in the audit log.
    async file(req, res) {
      const opened = await documents.open(req.params.id)
      await ctx.audit(ACTOR, 'tutor.document.view', 'tutor', opened.doc.tutorId, { documentId: opened.doc.id })
      sendStoredFile(res, opened)
    },
  }
}

module.exports = { createTutorsController }
