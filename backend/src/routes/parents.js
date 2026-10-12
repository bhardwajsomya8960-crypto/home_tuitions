const express = require('express');
const catalyst = require('../config/catalyst');
const geoService = require('../services/geoService');

const router = express.Router();

// Register parent
router.post('/register', async (req, res) => {
  try {
    const {
      name, phone, email, relationship,
      studentName, class: studentClass, board, subjects,
      address, pincode, latitude, longitude,
      preferredDays, preferredTimes, budget, mode
    } = req.body;

    // Create parent record
    const parent = await catalyst.createParent({
      name, phone, email, relationship
    });

    // Create student record
    const student = await catalyst.createStudent({
      parent_id: parent.id,
      name: studentName,
      class: studentClass,
      board,
      subjects
    });

    // Geocode if no coordinates provided
    let lat = latitude, lon = longitude;
    if (!lat || !lon) {
      const geocoded = await geoService.geocodeAddress(address, pincode);
      lat = geocoded.latitude;
      lon = geocoded.longitude;
    }

    // Create lead
    const lead = await catalyst.createLead({
      parent_id: parent.id,
      student_id: student.id,
      latitude: lat,
      longitude: lon,
      subjects,
      class: studentClass,
      board,
      mode,
      preferred_days: preferredDays,
      preferred_times: preferredTimes,
      budget
    });

    res.status(201).json({
      success: true,
      parent,
      student,
      lead,
      message: 'Parent registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get parent profile
router.get('/:parentId', async (req, res) => {
  try {
    const { parentId } = req.params;

    // TODO: Fetch from Catalyst
    res.json({
      parentId,
      name: 'Parent Name',
      phone: 'XXXX XXXX XX',
      email: 'parent@email.com'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get parent's students
router.get('/:parentId/students', async (req, res) => {
  try {
    const { parentId } = req.params;

    // TODO: Fetch from Catalyst
    res.json({
      students: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get parent's leads
router.get('/:parentId/leads', async (req, res) => {
  try {
    const { parentId } = req.params;

    // TODO: Fetch from Catalyst
    res.json({
      leads: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
