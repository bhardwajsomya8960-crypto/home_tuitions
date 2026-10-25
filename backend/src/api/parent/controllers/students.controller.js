function createStudentsController({ services }) {
  const { parents } = services
  return {
    add: req => parents.addStudent(req.user.id, req.body),
  }
}

module.exports = { createStudentsController }
