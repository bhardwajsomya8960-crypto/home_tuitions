// Calendar helpers. Dates are 'YYYY-MM-DD' strings; times are shown in India time (IST).
const addDays = (date, n) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const istLabel = iso => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const monthLabel = date => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' })

module.exports = { addDays, istLabel, monthLabel }
