const express = require('express')
const { publicMasters } = require('../services/masters')

// Public master data for form dropdowns (classes, boards, subjects, time slots, and so on).
const router = express.Router()
router.get('/', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300').json(publicMasters())
})

module.exports = router
