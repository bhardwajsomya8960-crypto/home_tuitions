// Maps over a list one item at a time. Used for lookups inside lists: MongoDB transactions do not
// allow parallel operations on one session, and lists here are small.
async function mapSeries(list, fn) {
  const out = []
  for (let i = 0; i < list.length; i++) out.push(await fn(list[i], i))
  return out
}

module.exports = { mapSeries }
