// Storage for operations data (parents, tutors, leads, matching, demos, classes, billing).
//
// Services call these methods and never write SQL. Records go in and come out in camelCase;
// list columns are JSON-encoded and boolean columns are 0/1 in the database. To move to another
// datastore, implement the same methods.
//
// All methods are synchronous (better-sqlite3), so `transaction(fn)` can wrap several of them
// atomically. The offer-accept path relies on this to stop two tutors accepting the same lead.

const TABLES = {
  parents: { json: ['consent'], bool: [] },
  students: { json: ['subjects'], bool: [] },
  tutors: { json: ['subjects', 'classes', 'boards', 'languages', 'modes', 'availability', 'consent'], bool: ['demo_available', 'accepting_leads'] },
  tutor_documents: { json: [], bool: [] },
  leads: { json: ['subjects', 'preferred_days', 'preferred_slots', 'pref_languages'], bool: ['no_tutor_found'] },
  lead_events: { json: [], bool: [] },
  match_runs: { json: ['settings', 'results'], bool: [] },
  assignments: { json: ['factors', 'reasons'], bool: [] },
  demos: { json: [], bool: [] },
  enrolments: { json: ['subjects', 'schedule'], bool: [] },
  class_sessions: { json: [], bool: ['tutor_present', 'student_present'] },
  invoices: { json: [], bool: [] },
  payments: { json: [], bool: [] },
  reviews: { json: [], bool: [] },
  settings: { json: ['value'], bool: [] },
  audit_log: { json: ['details'], bool: [] },
}

// Weekly slot lists are stored as [{ day, slot }]. Older seed data used { mon: ['evening'] };
// convert that on read so those records keep working.
const SLOT_LIST_COLUMNS = ['availability', 'schedule']
function toSlotList(value) {
  if (Array.isArray(value) || value === null || typeof value !== 'object') return Array.isArray(value) ? value : []
  return Object.entries(value).flatMap(([day, slots]) => (Array.isArray(slots) ? slots : [slots]).map(slot => ({ day, slot })))
}

const toSnake = key => key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)
const toCamel = key => key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())

function createOperationsRepository(db) {
  const columnsCache = {}
  function columns(table) {
    if (!columnsCache[table]) columnsCache[table] = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name))
    return columnsCache[table]
  }

  function encode(table, column, value) {
    const meta = TABLES[table]
    if (meta.json.includes(column)) return value === undefined || value === null ? null : JSON.stringify(value)
    if (meta.bool.includes(column)) return value === null || value === undefined ? null : (value ? 1 : 0)
    return value === undefined ? null : value
  }

  function decode(table, row) {
    if (!row) return null
    const meta = TABLES[table]
    const out = {}
    for (const [column, value] of Object.entries(row)) {
      let v = value
      if (meta.json.includes(column)) v = value === null ? null : JSON.parse(value)
      if (SLOT_LIST_COLUMNS.includes(column)) v = toSlotList(v)
      else if (meta.bool.includes(column)) v = value === null ? null : !!value
      out[toCamel(column)] = v
    }
    return out
  }

  function writable(table, record) {
    const cols = columns(table)
    return Object.entries(record)
      .map(([k, v]) => [toSnake(k), v])
      .filter(([column]) => cols.has(column))
  }

  function insert(table, record) {
    const entries = writable(table, record)
    const sql = `INSERT INTO ${table} (${entries.map(([c]) => c).join(', ')}) VALUES (${entries.map(() => '?').join(', ')})`
    db.prepare(sql).run(...entries.map(([c, v]) => encode(table, c, v)))
    return get(table, record.id ?? record.key)
  }

  function get(table, id) {
    const key = table === 'settings' ? 'key' : 'id'
    return decode(table, db.prepare(`SELECT * FROM ${table} WHERE ${key} = ?`).get(id))
  }

  // Updates only when `where` (extra column = value conditions) still holds. Returns the number
  // of rows changed, so callers can detect that another request got there first.
  function update(table, id, fields, where = {}) {
    const entries = writable(table, fields).filter(([c]) => c !== 'id')
    if (entries.length === 0) return 0
    const conditions = writable(table, where)
    const sql = `UPDATE ${table} SET ${entries.map(([c]) => `${c} = ?`).join(', ')} WHERE id = ?${conditions.map(([c]) => ` AND ${c} = ?`).join('')}`
    return db.prepare(sql).run(...entries.map(([c, v]) => encode(table, c, v)), id, ...conditions.map(([c, v]) => encode(table, c, v))).changes
  }

  // Equality filters on columns, plus optional ORDER BY / LIMIT / OFFSET.
  const filterEntries = (table, filters) => writable(table, filters).filter(([, v]) => v !== undefined)

  function find(table, filters = {}, { orderBy = 'created_at DESC', limit, offset } = {}) {
    const entries = filterEntries(table, filters)
    const where = entries.length ? `WHERE ${entries.map(([c, v]) => (Array.isArray(v) ? `${c} IN (${v.map(() => '?').join(', ')})` : `${c} = ?`)).join(' AND ')}` : ''
    const params = entries.flatMap(([c, v]) => (Array.isArray(v) ? v : [encode(table, c, v)]))
    const page = limit ? ` LIMIT ${Number(limit)} OFFSET ${Number(offset) || 0}` : ''
    return db.prepare(`SELECT * FROM ${table} ${where} ORDER BY ${orderBy}${page}`).all(...params).map(r => decode(table, r))
  }

  function count(table, filters = {}) {
    const entries = filterEntries(table, filters)
    const where = entries.length ? `WHERE ${entries.map(([c, v]) => (Array.isArray(v) ? `${c} IN (${v.map(() => '?').join(', ')})` : `${c} = ?`)).join(' AND ')}` : ''
    const params = entries.flatMap(([c, v]) => (Array.isArray(v) ? v : [encode(table, c, v)]))
    return db.prepare(`SELECT COUNT(*) AS n FROM ${table} ${where}`).get(...params).n
  }

  function findOne(table, filters) {
    return find(table, filters, { limit: 1 })[0] || null
  }

  return {
    transaction: fn => db.transaction(fn)(),
    insert, get, update, find, findOne, count,

    saveSetting(key, value, updatedAt, updatedBy) {
      db.prepare(`INSERT INTO settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`)
        .run(key, JSON.stringify(value), updatedAt, updatedBy)
    },

    // Offers whose acceptance window has passed and that are still open.
    findExpiredOffers(nowIso) {
      return db.prepare("SELECT * FROM assignments WHERE status = 'offered' AND expires_at <= ? ORDER BY expires_at")
        .all(nowIso).map(r => decode('assignments', r))
    },

    // Sums for the finance dashboard.
    invoiceTotals() {
      return db.prepare(`SELECT
          COALESCE(SUM(amount_paid), 0) AS collected,
          COALESCE(SUM(CASE WHEN status IN ('pending', 'partial') THEN amount - amount_paid ELSE 0 END), 0) AS outstanding
        FROM invoices WHERE status != 'void'`).get()
    },

    overdueTotal(today) {
      return db.prepare("SELECT COALESCE(SUM(amount - amount_paid), 0) AS n FROM invoices WHERE status IN ('pending', 'partial') AND due_date < ?").get(today).n
    },

    countBy(table, column) {
      return Object.fromEntries(db.prepare(`SELECT ${column} AS k, COUNT(*) AS n FROM ${table} GROUP BY ${column}`).all().map(r => [r.k, r.n]))
    },

    nextSequence(table, prefix) {
      const n = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n + 1
      return `${prefix}${String(n).padStart(6, '0')}`
    },
  }
}

module.exports = { createOperationsRepository }
