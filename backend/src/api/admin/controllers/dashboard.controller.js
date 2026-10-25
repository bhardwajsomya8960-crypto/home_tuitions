const { publicMasters } = require('../../../shared/masters')

// Overview figures and the operations queues. Open offers past their window are expired first.
function createDashboardController({ services }) {
  const { dashboard, assignments } = services
  return {
    async dashboard() {
      await assignments.expireOffers()
      return dashboard.dashboard()
    },
    async operations() {
      await assignments.expireOffers()
      return dashboard.operations()
    },
    masters: () => publicMasters(),
  }
}

module.exports = { createDashboardController }
