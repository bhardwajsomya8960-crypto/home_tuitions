// Expired tutor offers move to the next tutor even when nobody is using the app. Offers are also
// expired on every read, so a missed sweep only delays the next offer.
//
// With several API servers, each runs the sweep; that is safe because expiring an offer is a
// conditional update, so only one server acts on each offer.
const SWEEP_MS = 30 * 1000

function startOfferExpiryJob(services, { intervalMs = SWEEP_MS } = {}) {
  let running = false
  const timer = setInterval(async () => {
    if (running) return
    running = true
    try {
      await services.assignments.expireOffers()
    } catch (err) {
      console.error('Offer expiry sweep failed:', err)
    } finally {
      running = false
    }
  }, intervalMs)
  timer.unref()
  return () => clearInterval(timer)
}

module.exports = { startOfferExpiryJob }
