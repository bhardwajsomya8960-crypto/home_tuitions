const express = require('express');
const catalyst = require('../config/catalyst');
const geoService = require('../services/geoService');

const router = express.Router();

// Register tutor
router.post('/register', async (req, res) => {
  try {
    const {
      name, phone, email, gender, qualification, experience,
      subjects, classes, boards, teachingLanguages, teachingMode,
      address, pincode, latitude, longitude, serviceRadius
    } = req.body;

    // Geocode if no coordinates provided
    let lat = latitude, lon = longitude;
    if (!lat || !lon) {
      const geocoded = await geoService.geocodeAddress(address, pincode);
      lat = geocoded.latitude;
      lon = geocoded.longitude;
    }

    const tutor = await catalyst.createTutor({
      name, phone, email, gender, qualification, experience,
      subjects, classes, boards, teachingLanguages, teachingMode,
      service_radius: serviceRadius || 8,
      latitude: lat,
      longitude: lon
    });

    res.status(201).json({
      success: true,
      tutor,
      message: 'Tutor registered. Awaiting KYC verification.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tutor profile
router.get('/:tutorId', async (req, res) => {
  try {
    const { tutorId } = req.params;
    // TODO: Fetch from Catalyst
    res.json({ tutor: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tutor availability
router.post('/:tutorId/availability', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { availableDays, availableSlots } = req.body;

    // TODO: Create/update availability in Catalyst
    res.json({
      success: true,
      message: 'Availability updated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tutor's assigned leads
router.get('/:tutorId/leads', async (req, res) => {
  try {
    const { tutorId } = req.params;
    // TODO: Fetch from Catalyst
    res.json({ leads: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept lead
router.post('/:tutorId/leads/:leadId/accept', async (req, res) => {
  try {
    const { tutorId, leadId } = req.params;

    // TODO: Update assignment status in Catalyst
    // TODO: Notify parent and BDA
    res.json({
      success: true,
      message: 'Lead accepted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject lead
router.post('/:tutorId/leads/:leadId/reject', async (req, res) => {
  try {
    const { tutorId, leadId } = req.params;
    const { reason } = req.body;

    // TODO: Update assignment status in Catalyst
    // TODO: Move to next tutor in queue
    // TODO: Notify admin
    res.json({
      success: true,
      message: 'Lead rejected'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tutor's classes/students
router.get('/:tutorId/classes', async (req, res) => {
  try {
    const { tutorId } = req.params;
    // TODO: Fetch from Catalyst
    res.json({ classes: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload KYC documents
router.post('/:tutorId/kyc', async (req, res) => {
  try {
    const { tutorId } = req.params;
    // TODO: Handle file uploads
    res.json({
      success: true,
      message: 'Documents uploaded. Verification in progress.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
