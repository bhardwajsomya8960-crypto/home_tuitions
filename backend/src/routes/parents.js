const express = require('express');
const catalyst = require('../config/catalyst');
const geoService = require('../services/geoService');
const { AppError } = require('../errors');

const router = express.Router();

// Register parent
router.post('/register', async (req, res) => {
  try {
    const {
      name, phone, email, relationship,
      studentName, class: studentClass, board, subjects,
      address, pincode, latitude, longitude,
      preferredDays, preferredTimes, budget, mode,
      courseId, courseSlug
    } = req.body;

    // Optional course context. Validated before anything is written, so an invalid
    // reference does not leave a half-created parent or student behind.
    if (courseId != null && typeof courseId !== 'string') {
      return res.status(400).json({ error: 'courseId must be text', code: 'VALIDATION_FAILED' });
    }
    if (courseSlug != null && typeof courseSlug !== 'string') {
      return res.status(400).json({ error: 'courseSlug must be text', code: 'VALIDATION_FAILED' });
    }
    const course = await req.app.locals.catalogueService.resolvePublicCourse({ courseId, courseSlug });

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
      budget,
      course_id: course ? course.id : null,
      course_slug: course ? course.slug : null
    });

    res.status(201).json({
      success: true,
      parent,
      student,
      lead,
      message: 'Parent registered successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
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
