const { publicMasters } = require('../../../shared/masters')

// Master data for form dropdowns (classes, boards, subjects, time slots, and so on).
function createMastersController() {
  return {
    list(req, res) {
      res.set('Cache-Control', 'public, max-age=300')
      return publicMasters()
    },
  }
}

module.exports = { createMastersController }
