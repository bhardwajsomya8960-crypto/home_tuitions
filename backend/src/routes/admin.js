const express = require('express');
const catalyst = require('../config/catalyst');
const matchingService = require('../services/matchingService');

const router = express.Router();

const VERIFICATION_DECISIONS = ['verified', 'rejected'];
const LEAD_STAGES = ['new', 'contacted', 'qualified', 'matching', 'offered', 'accepted', 'converted', 'lost'];

function parsePage(query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limit, offset };
}

function sumWhere(records, status) {
  return records
    .filter(r => r.status === status)
    .reduce((total, r) => total + (Number(r.amount) || 0), 0);
}

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const { leads, tutors, payments, invoices } = catalyst.data;
    res.json({
      totalLeads: leads.length,
      newLeads: leads.filter(l => l.status === 'new').length,
      convertedLeads: leads.filter(l => l.status === 'converted').length,
      totalTutors: tutors.length,
      activeTutors: tutors.filter(t => t.verification_status === 'verified').length,
      pendingVerification: tutors.filter(t => t.verification_status === 'pending').length,
      totalRevenue: sumWhere(payments, 'paid'),
      pendingPayments: sumWhere(invoices, 'pending')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (parents and tutors), optionally filtered by role and status
router.get('/users', async (req, res) => {
  try {
    const { role, status } = req.query;
    const { limit, offset } = parsePage(req.query);

    const parents = catalyst.data.parents.map(p => ({ ...p, role: 'parent', status: p.verification_status }));
    const tutors = catalyst.data.tutors.map(t => ({ ...t, role: 'tutor', status: t.verification_status }));
    let users = [...parents, ...tutors];
    if (role) users = users.filter(u => u.role === role);
    if (status) users = users.filter(u => u.status === status);

    const total = users.length;
    res.json({ users: users.slice(offset, offset + limit), total, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tutors with verification status
router.get('/tutors', async (req, res) => {
  try {
    const { status } = req.query;
    const { limit, offset } = parsePage(req.query);

    let tutors = catalyst.data.tutors;
    if (status) tutors = tutors.filter(t => t.verification_status === status);

    const total = tutors.length;
    res.json({ tutors: tutors.slice(offset, offset + limit), total, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify/reject tutor KYC
router.post('/tutors/:tutorId/verify', async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { status, notes } = req.body || {};

    if (!VERIFICATION_DECISIONS.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VERIFICATION_DECISIONS.join(', ')}` });
    }
    if (notes !== undefined && typeof notes !== 'string') {
      return res.status(400).json({ error: 'notes must be a string' });
    }

    const tutor = await catalyst.getTutorById(tutorId);
    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    const updated = await catalyst.updateRecord('tutors', tutorId, {
      verification_status: status,
      verification_notes: notes || null,
      verified_at: new Date()
    });

    // TODO: Send email to tutor (emailService) once templates are approved
    res.json({
      success: true,
      tutor: updated,
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
    const pipeline = Object.fromEntries(LEAD_STAGES.map(stage => [stage, 0]));
    for (const lead of catalyst.data.leads) {
      if (lead.status in pipeline) pipeline[lead.status] += 1;
    }
    res.json(pipeline);
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
