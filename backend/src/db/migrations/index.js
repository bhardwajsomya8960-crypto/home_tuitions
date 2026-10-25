// Ordered schema migrations. Append new versions; never edit an applied one.
const MIGRATIONS = [
  { version: 1, sql: require('./001_catalogue') },
  { version: 2, sql: require('./002_operations') },
  { version: 3, sql: require('./003_document_details') },
]
module.exports = { MIGRATIONS }
