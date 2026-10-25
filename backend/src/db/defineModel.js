// Shared conventions for every collection:
// - `_id` is a string UUID created by the app (exposed to services and the API as `id`).
// - Timestamps (createdAt, updatedAt, ...) are ISO-8601 strings in UTC, and calendar dates are
//   'YYYY-MM-DD' strings. Both sort correctly as text and match what the API returns.
// - Unknown fields are dropped (strict), and there is no `__v` version key.
const mongoose = require('mongoose')

const { Schema } = mongoose

function defineModel(name, fields, { indexes = [], collection } = {}) {
  if (mongoose.models[name]) return mongoose.models[name]
  const schema = new Schema({ _id: { type: String, required: true }, ...fields }, {
    collection, strict: true, versionKey: false, minimize: false, id: false,
  })
  for (const [spec, options] of indexes) schema.index(spec, options)
  return mongoose.model(name, schema)
}

// Field shorthands used by the model files.
const types = {
  string: (extra = {}) => ({ type: String, default: null, ...extra }),
  requiredString: (extra = {}) => ({ type: String, required: true, ...extra }),
  number: (extra = {}) => ({ type: Number, default: null, ...extra }),
  bool: (defaultValue = false) => ({ type: Boolean, default: defaultValue }),
  strings: () => ({ type: [String], default: [] }),
  // Object and array defaults are copied per document so documents never share one instance.
  mixed: (defaultValue = null) => ({ type: Schema.Types.Mixed, default: defaultValue === null ? null : () => structuredClone(defaultValue) }),
  enum: (values, extra = {}) => ({ type: String, enum: values, ...extra }),
  timestamp: (extra = {}) => ({ type: String, default: null, ...extra }),
}

module.exports = { defineModel, types, Schema }
