const express = require('express');

const router = express.Router();

// Create class session
router.post('/', async (req, res) => {
  try {
    const { enrolmentId, scheduledAt, notes } = req.body;

    // TODO: Create in Catalyst
    res.status(201).json({
      success: true,
      classId: 'class_' + Date.now(),
      scheduledAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record attendance
router.post('/:classId/attendance', async (req, res) => {
  try {
    const { classId } = req.params;
    const { tutorAttended, studentAttended, notes } = req.body;

    // TODO: Update in Catalyst
    res.json({
      success: true,
      message: 'Attendance recorded'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get class details
router.get('/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    // TODO: Fetch from Catalyst
    res.json({ class: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get enrolment's classes
router.get('/enrolment/:enrolmentId', async (req, res) => {
  try {
    const { enrolmentId } = req.params;
    // TODO: Fetch from Catalyst
    res.json({ classes: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
