// Parses ?page=&limit= into { limit, offset, page }.
function pageParams(query = {}) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100)
  const page = Math.max(parseInt(query.page, 10) || 1, 1)
  return { limit, offset: (page - 1) * limit, page }
}

module.exports = { pageParams }
