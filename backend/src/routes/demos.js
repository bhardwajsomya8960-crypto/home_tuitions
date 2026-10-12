const express = require('express');
const emailService = require('../services/emailService');

const router = express.Router();

// Schedule demo
router.post('/', async (req, res) => {
  try {
    const { leadId, tutorId, scheduledAt } = req.body;

    // TODO: Create demo in Catalyst
    // TODO: Create Google Calendar event
    // TODO: Send emails to parent and tutor

    res.status(201).json({
      success: true,
      demoId: 'demo_' + Date.now(),
      scheduledAt,
      message: 'Demo scheduled successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get demo details
router.get('/:demoId', async (req, res) => {
  try {
    const { demoId } = req.params;
    // TODO: Fetch from Catalyst
    res.json({ demo: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update demo status
router.patch('/:demoId', async (req, res) => {
  try {
    const { demoId } = req.params;
    const { status, outcome } = req.body;

    // TODO: Update in Catalyst
    // status: 'scheduled' | 'completed' | 'no_show' | 'cancelled'
    // outcome: 'interested' | 'follow_up' | 'not_interested' | 'tutor_change'

    res.json({
      success: true,
      message: 'Demo updated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reschedule demo
router.post('/:demoId/reschedule', async (req, res) => {
  try {
    const { demoId } = req.params;
    const { newTime } = req.body;

    // TODO: Update in Catalyst
    // TODO: Update Google Calendar event
    // TODO: Send reminder emails

    res.json({
      success: true,
      message: 'Demo rescheduled'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
