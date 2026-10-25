const { pageParams } = require('../../shared/utils/pagination')

// Reading the audit log. Entries are written through ctx.audit() by every module.
function createAuditService(ctx) {
  const { repo } = ctx

  return {
    async listAudit(query) {
      const { limit, offset, page } = pageParams(query)
      const filters = {}
      if (typeof query.entity === 'string' && query.entity) filters.entity = query.entity
      if (typeof query.entityId === 'string' && query.entityId) filters.entityId = query.entityId
      const total = await repo.count('AuditLog', filters)
      return { items: await repo.find('AuditLog', filters, { limit, skip: offset }), total, page, limit }
    },
  }
}

module.exports = { createAuditService }
