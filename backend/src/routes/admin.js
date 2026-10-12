const express = require('express');
const matchingService = require('../services/matchingService');

const router = express.Router();

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    // TODO: Fetch from Catalyst
    res.json({
      totalLeads: 0,
      newLeads: 0,
      convertedLeads: 0,
      totalTutors: 0,
      activeTutors: 0,
      pendingVerification: 0,
      totalRevenue: 0,
      pendingPayments: 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { role, status, limit = 20, offset = 0 } = req.query;
    // TODO: Fetch from Catalyst with filters
    res.json({ users: [], total: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tutors with verification status
router.get('/tutors', async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    // TODO: Fetch from Catalyst
    res.json({ tutors: [], total: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify/reject tutor KYC
router.post('/tutors/:tutorId/verify', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { status, notes } = req.body;
    // status: 'verified', 'rejected'

    // TODO: Update tutor in Catalyst
    // TODO: Send email to tutor

    res.json({
      success: true,
      message: `Tutor ${status}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get matching configuration
router.get('/config/matching', async (req, res) => {
  try {
    res.json({
      weights: matchingService.weights,
      config: matchingService.config
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update matching weights
router.post('/config/matching/weights', async (req, res) => {
  try {
    const { distance, subjectFit, availability, experience, quality, acceptanceReliability, feeFit } = req.body;

    matchingService.updateWeights({
      distance, subjectFit, availability, experience, quality, acceptanceReliability, feeFit
    });

    // TODO: Persist to Catalyst
    res.json({
      success: true,
      weights: matchingService.weights,
      message: 'Matching weights updated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lead pipeline
router.get('/leads/pipeline', async (req, res) => {
  try {
    // TODO: Group leads by status from Catalyst
    res.json({
      new: 0,
      contacted: 0,
      qualified: 0,
      matching: 0,
      offered: 0,
      accepted: 0,
      converted: 0,
      lost: 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get finance dashboard
router.get('/finance', async (req, res) => {
  try {
    // TODO: Fetch from Catalyst
    res.json({
      totalCollected: 0,
      pendingAmount: 0,
      overdue: 0,
      refunds: 0,
      tutorPayouts: 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get configuration masters (subjects, boards, etc)
router.get('/masters', async (req, res) => {
  try {
    res.json({
      subjects: ['Maths', 'Science', 'English', 'History', 'Geography', 'Sanskrit'],
      classes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      boards: ['CBSE', 'ICSE', 'State', 'IB'],
      languages: ['English', 'Hindi', 'Marathi'],
      modes: ['Home', 'Online', 'Hybrid'],
      qualifications: ['Bachelor', 'Master', 'PhD', 'Diploma']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
