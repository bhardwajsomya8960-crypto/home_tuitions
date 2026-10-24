// Ordered schema migrations. Append new versions; never edit an applied one.
const MIGRATIONS = [
  { version: 1, sql: require('./001_catalogue') },
]
module.exports = { MIGRATIONS }
