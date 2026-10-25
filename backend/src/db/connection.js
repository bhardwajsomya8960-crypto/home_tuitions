// MongoDB connection (Mongoose). One connection per process, opened at startup.
//
// MONGODB_URI points at MongoDB Atlas in production, or a local server in development, e.g.
//   mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/hometutor?retryWrites=true&w=majority
//   mongodb://127.0.0.1:27017/hometutor
//
// Multi-document transactions need a replica set. Atlas always is one; a plain local mongod is
// not, so transactions are skipped there (see repository.js) and a warning is printed.
const mongoose = require('mongoose')
require('./models') // registers every schema before indexes are synced

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/hometutor'

let state = { supportsTransactions: false }

async function connect(uri = process.env.MONGODB_URI || DEFAULT_URI, { dbName } = {}) {
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000, autoIndex: false })
  const hello = await mongoose.connection.db.admin().command({ hello: 1 })
  state = { supportsTransactions: Boolean(hello.setName || hello.msg === 'isdbgrid') }
  if (!state.supportsTransactions) {
    console.warn('MongoDB is not a replica set: multi-document transactions are disabled. Use Atlas or a replica set in production.')
  }
  // Create collections and indexes up front: collections cannot be created inside a transaction
  // on older servers, and unique indexes (phone numbers, lead codes, slugs) enforce data rules.
  for (const model of Object.values(mongoose.models)) {
    await model.createCollection().catch(err => { if (err.codeName !== 'NamespaceExists') throw err })
    await model.syncIndexes()
  }
  return mongoose.connection
}

async function disconnect() {
  await mongoose.disconnect()
}

const supportsTransactions = () => state.supportsTransactions

module.exports = { connect, disconnect, supportsTransactions, mongoose, DEFAULT_URI }
