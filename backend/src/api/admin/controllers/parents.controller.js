const ACTOR = 'admin'

// Parent accounts managed by staff: create, edit, add students and tuition requests.
function createParentsController({ services }) {
  const { parentAdmin, leads } = services
  return {
    list: req => parentAdmin.listParents(req.query),
    detail: req => parentAdmin.parentDetail(req.params.id),
    create: req => parentAdmin.createParent(req.body, ACTOR),
    update: req => parentAdmin.updateParent(req.params.id, req.body, ACTOR),
    addStudent: req => parentAdmin.addStudent(req.params.id, req.body, ACTOR),
    // Returns the new request in full, so the lead screen can open straight away.
    createRequest: async req => leads.leadDetail((await leads.createLeadForParent(req.params.id, req.body, ACTOR)).id),
  }
}

module.exports = { createParentsController }
