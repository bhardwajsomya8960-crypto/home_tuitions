// Data access for the services. Services call these methods with a model name and plain
// objects; they never use Mongoose directly, which keeps business rules easy to test and read.
//
// Records go in and come out as plain objects with `id` (stored as `_id`). Every field defined
// in the schema is present on reads, with null (or []) when it has no value.
//
// transaction(fn) runs fn in a MongoDB transaction. The session travels with the async call
// chain (AsyncLocalStorage), so every repository call inside fn joins the transaction without
// passing it around. Conditional updates (`where`) plus transactions are what stop two tutors
// accepting the same lead at once.
const { AsyncLocalStorage } = require('async_hooks')
const mongoose = require('mongoose')
const models = require('./models')
const { supportsTransactions } = require('./connection')
const { toRanges } = require('../modules/matching/availability')

const als = new AsyncLocalStorage()
const currentSession = () => als.getStore()?.session || null

// Fixes up records on the way out: older availability formats become time ranges.
const READ_FIXES = {
  Tutor: tutor => ({ ...tutor, availability: toRanges(tutor.availability) }),
}

function modelFor(name) {
  const model = models[name]
  if (!model) throw new Error(`Unknown model "${name}"`)
  return model
}

const fieldDefaults = {}
function defaultsFor(name) {
  if (!fieldDefaults[name]) {
    const out = {}
    modelFor(name).schema.eachPath((path, type) => {
      if (path === '_id' || path.includes('.')) return
      const value = typeof type.defaultValue === 'function' ? type.defaultValue() : type.defaultValue
      out[path] = value === undefined ? (type.instance === 'Array' ? [] : null) : value
    })
    fieldDefaults[name] = out
  }
  return fieldDefaults[name]
}

function decode(name, doc) {
  if (!doc) return null
  const { _id, ...rest } = doc
  const filled = { id: _id }
  for (const [key, fallback] of Object.entries(defaultsFor(name))) {
    filled[key] = rest[key] === undefined ? structuredClone(fallback) : rest[key]
  }
  return READ_FIXES[name] ? READ_FIXES[name](filled) : filled
}

// Equality filters; an array value means "any of". `id` maps to `_id`; undefined is ignored.
function toFilter(filters = {}) {
  const out = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue
    out[key === 'id' ? '_id' : key] = Array.isArray(value) ? { $in: value } : value
  }
  return out
}

const withoutUndefined = fields => Object.fromEntries(Object.entries(fields).filter(([k, v]) => v !== undefined && k !== 'id' && k !== '_id'))

// Sort keys plus `_id` as a tie-breaker in the same direction (ids are time-ordered).
function toSort(sort = { createdAt: -1 }) {
  const first = Object.values(sort)[0] || -1
  return { ...sort, _id: first }
}

function createRepository() {
  const session = currentSession

  async function get(name, id) {
    if (typeof id !== 'string' || !id) return null
    return decode(name, await modelFor(name).findById(id).session(session()).lean())
  }

  async function find(name, filters = {}, { sort, limit, skip } = {}) {
    let query = modelFor(name).find(toFilter(filters)).sort(toSort(sort)).session(session())
    if (skip) query = query.skip(skip)
    if (limit) query = query.limit(limit)
    return (await query.lean()).map(doc => decode(name, doc))
  }

  return {
    async transaction(fn) {
      if (currentSession() || !supportsTransactions()) return fn()
      const s = await mongoose.startSession()
      try {
        let result
        await s.withTransaction(async () => { result = await als.run({ session: s }, fn) })
        return result
      } finally {
        await s.endSession()
      }
    },

    async insert(name, record) {
      const { id, ...rest } = record
      const [doc] = await modelFor(name).create([{ _id: id, ...withoutUndefined(rest) }], { session: session() })
      return decode(name, doc.toObject())
    },

    get,
    find,

    async findOne(name, filters, options = {}) {
      return (await find(name, filters, { ...options, limit: 1 }))[0] || null
    },

    async count(name, filters = {}) {
      return modelFor(name).countDocuments(toFilter(filters)).session(session())
    },

    // Updates only while `where` still holds and returns how many records matched, so callers
    // can tell that another request changed the record first.
    async update(name, id, fields, where = {}) {
      const set = withoutUndefined(fields)
      if (Object.keys(set).length === 0) return 0
      const res = await modelFor(name).updateOne({ _id: id, ...toFilter(where) }, { $set: set }, { session: session() })
      return res.matchedCount
    },

    async remove(name, id) {
      const res = await modelFor(name).deleteOne({ _id: id }, { session: session() })
      return res.deletedCount
    },

    async saveSetting(key, value, updatedAt, updatedBy) {
      await models.Setting.updateOne({ _id: key }, { $set: { value, updatedAt, updatedBy } }, { upsert: true, session: session() })
    },

    // Offers whose acceptance window has passed and that are still open.
    async findExpiredOffers(nowIso) {
      const docs = await models.Assignment.find({ status: 'offered', expiresAt: { $lte: nowIso } }).sort({ expiresAt: 1 }).session(session()).lean()
      return docs.map(doc => decode('Assignment', doc))
    },

    // Sums for the finance dashboard.
    async invoiceTotals() {
      const [row] = await models.Invoice.aggregate([
        { $match: { status: { $ne: 'void' } } },
        {
          $group: {
            _id: null,
            collected: { $sum: '$amountPaid' },
            outstanding: { $sum: { $cond: [{ $in: ['$status', ['pending', 'partial']] }, { $subtract: ['$amount', '$amountPaid'] }, 0] } },
          },
        },
      ]).session(session())
      return { collected: row?.collected || 0, outstanding: row?.outstanding || 0 }
    },

    async overdueTotal(today) {
      const [row] = await models.Invoice.aggregate([
        { $match: { status: { $in: ['pending', 'partial'] }, dueDate: { $lt: today } } },
        { $group: { _id: null, n: { $sum: { $subtract: ['$amount', '$amountPaid'] } } } },
      ]).session(session())
      return row?.n || 0
    },

    async countBy(name, field) {
      const rows = await modelFor(name).aggregate([{ $group: { _id: `$${field}`, n: { $sum: 1 } } }]).session(session())
      return Object.fromEntries(rows.map(r => [r._id, r.n]))
    },

    // Next number in a named sequence, e.g. HT-L-000001. Atomic, so two requests never get the
    // same number.
    async nextSequence(sequence, prefix) {
      const doc = await models.Counter.findOneAndUpdate({ _id: sequence }, { $inc: { seq: 1 } }, { upsert: true, new: true, session: session() }).lean()
      return `${prefix}${String(doc.seq).padStart(6, '0')}`
    },
  }
}

module.exports = { createRepository }
