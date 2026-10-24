// Opens the catalogue database. SQLite is used for local development only.
// Production must use a verified, shared datastore (see docs/LEARNING_CATALOGUE_PROPOSAL.md).
const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')
const { MIGRATIONS } = require('../db/migrations')

const DEFAULT_PATH = path.join(__dirname, '..', '..', 'data', 'catalogue.sqlite')

function migrate(db) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)')
  const applied = new Set(db.prepare('SELECT version FROM schema_migrations').all().map(r => r.version))
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue
    db.transaction(() => {
      db.exec(migration.sql)
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(migration.version, new Date().toISOString())
    })()
  }
}

function openDatabase(filename = process.env.CATALOGUE_DB_PATH || DEFAULT_PATH) {
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true })
  const db = new Database(filename)
  db.pragma('foreign_keys = ON')
  if (filename !== ':memory:') db.pragma('journal_mode = WAL')
  migrate(db)
  return db
}

let shared = null
function getDatabase() {
  if (!shared) shared = openDatabase()
  return shared
}

module.exports = { openDatabase, getDatabase, DEFAULT_PATH }
