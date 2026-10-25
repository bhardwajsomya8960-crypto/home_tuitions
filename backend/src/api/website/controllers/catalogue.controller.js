// Public, read-only catalogue. Only published content is returned.
function createCatalogueController({ services }) {
  const { catalogue } = services
  return {
    listCategories: req => catalogue.listPublicCategories(req.query),
    getCategory: req => catalogue.getPublicCategory(req.params.slug),
    listCourses: req => catalogue.listPublicCourses(req.query),
    getCourse: req => catalogue.getPublicCourse(req.params.slug),
  }
}

module.exports = { createCatalogueController }
