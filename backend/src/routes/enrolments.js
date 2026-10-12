const express = require('express');
const emailService = require('../services/emailService');

const router = express.Router();

// Create enrolment (convert lead)
router.post('/', async (req, res) => {
  try {
    const { leadId, tutorId, studentId, mode, startDate, feePerMonth } = req.body;

    // TODO: Create enrolment in Catalyst
    // TODO: Create first invoice
    // TODO: Notify parent and tutor

    res.status(201).json({
      success: true,
      enrolmentId: 'enrol_' + Date.now(),
      status: 'active',
      startDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get enrolment details
router.get('/:enrolmentId', async (req, res) => {
  try {
    const { enrolmentId } = req.params;
    // TODO: Fetch from Catalyst
    res.json({ enrolment: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student's enrolments
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    // TODO: Fetch from Catalyst
    res.json({ enrolments: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update enrolment status
router.patch('/:enrolmentId', async (req, res) => {
  try {
    const { enrolmentId } = req.params;
    const { status } = req.body;
    // status: 'active', 'paused', 'completed', 'cancelled'

    // TODO: Update in Catalyst
    res.json({
      success: true,
      message: 'Enrolment updated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
