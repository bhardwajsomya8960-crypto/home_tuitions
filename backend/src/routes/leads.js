const express = require('express');
const catalyst = require('../config/catalyst');
const matchingService = require('../services/matchingService');
const emailService = require('../services/emailService');

const router = express.Router();

// Get all leads (for admin/BDA)
router.get('/', async (req, res) => {
  try {
    // TODO: Fetch from Catalyst
    res.json({ leads: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lead by ID
router.get('/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    // TODO: Fetch from Catalyst
    res.json({ lead: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run matching algorithm for a lead
router.post('/:leadId/match', async (req, res) => {
  try {
    const { leadId } = req.params;
    const { adminConfig } = req.body;

    // TODO: Fetch lead from Catalyst
    // TODO: Fetch all active verified tutors from Catalyst
    const lead = {
      id: leadId,
      latitude: 17.3850,
      longitude: 78.4867,
      subjects: ['Maths'],
      class: 8,
      board: 'CBSE',
      mode: 'home',
      preferred_days: ['Monday', 'Wednesday', 'Friday'],
      preferred_times: ['4:00 PM - 5:00 PM'],
      budget: 500
    };

    const tutors = [
      {
        id: 'tutor_1',
        name: 'Rahul Kumar',
        latitude: 17.3900,
        longitude: 78.4800,
        distance: 0.5,
        subjects: ['Maths', 'Science'],
        classes: [7, 8, 9],
        boards: ['CBSE'],
        experience: 5,
        rating: 4.8,
        expected_fee: 500,
        available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        verification_status: 'verified',
        acceptance_rate: 0.85
      },
      {
        id: 'tutor_2',
        name: 'Priya Singh',
        latitude: 17.3950,
        longitude: 78.4750,
        distance: 1.2,
        subjects: ['Maths', 'English'],
        classes: [6, 7, 8],
        boards: ['CBSE'],
        experience: 3,
        rating: 4.5,
        expected_fee: 450,
        available_days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        verification_status: 'verified',
        acceptance_rate: 0.90
      }
    ];

    const rankedTutors = matchingService.rankTutorsForLead(lead, tutors, adminConfig);

    // Store assignments in Catalyst and send offers
    for (const ranked of rankedTutors) {
      // TODO: Create assignment record in Catalyst
      // await emailService.sendLeadOfferEmail(
      //   'tutor@email.com',
      //   'Tutor Name',
      //   lead,
      //   matchingService.getAssignmentExpiry()
      // );
    }

    res.json({
      success: true,
      leadId,
      totalMatches: rankedTutors.length,
      topMatches: rankedTutors.slice(0, 3),
      allMatches: rankedTutors
    });
  } catch (error) {
    console.error('Matching error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get ranked tutors for a lead
router.get('/:leadId/tutors', async (req, res) => {
  try {
    const { leadId } = req.params;
    // TODO: Fetch assignments from Catalyst
    res.json({ tutors: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
