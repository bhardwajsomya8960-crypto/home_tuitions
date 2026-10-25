// Managing categories and courses (draft, publish, archive).
function createCatalogueController({ services }) {
  const { catalogue } = services
  const transition = (kind, action) => req => (kind === 'category'
    ? catalogue.transitionCategory(req.params.id, action, req.admin.id)
    : catalogue.transitionCourse(req.params.id, action, req.admin.id))
  return {
    listCategories: req => catalogue.listAdminCategories(req.query),
    createCategory: req => catalogue.createCategory(req.body, req.admin.id),
    getCategory: req => catalogue.getAdminCategory(req.params.id),
    updateCategory: req => catalogue.updateCategory(req.params.id, req.body, req.admin.id),
    listCourses: req => catalogue.listAdminCourses(req.query),
    createCourse: req => catalogue.createCourse(req.body, req.admin.id),
    getCourse: req => catalogue.getAdminCourse(req.params.id),
    updateCourse: req => catalogue.updateCourse(req.params.id, req.body, req.admin.id),
    transition,
  }
}

module.exports = { createCatalogueController }
