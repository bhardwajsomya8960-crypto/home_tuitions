function createAuditController({ services }) {
  const { audit } = services
  return {
    list: req => audit.listAudit(req.query),
  }
}

module.exports = { createAuditController }
