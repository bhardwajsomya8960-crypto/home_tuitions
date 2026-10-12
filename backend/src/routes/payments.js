const express = require('express');

const router = express.Router();

// Create invoice
router.post('/invoices', async (req, res) => {
  try {
    const { studentId, tutorId, amount, dueDate, description } = req.body;

    // TODO: Create invoice in Catalyst
    res.status(201).json({
      success: true,
      invoiceId: 'inv_' + Date.now(),
      status: 'pending',
      amount,
      dueDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get invoice
router.get('/invoices/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    // TODO: Fetch from Catalyst
    res.json({ invoice: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record payment (manual entry - no gateway)
router.post('/payments', async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod, referenceId, notes } = req.body;

    // paymentMethod: 'bank_transfer', 'upi', 'cash', 'check', 'other'
    // Store payment record without gateway integration

    // TODO: Create payment record in Catalyst
    // TODO: Update invoice status
    // TODO: Send receipt email

    res.status(201).json({
      success: true,
      paymentId: 'pay_' + Date.now(),
      invoiceId,
      amount,
      status: 'recorded'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment
router.get('/payments/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    // TODO: Fetch from Catalyst
    res.json({ payment: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get invoices for parent
router.get('/parent/:parentId/invoices', async (req, res) => {
  try {
    const { parentId } = req.params;
    // TODO: Fetch from Catalyst
    res.json({ invoices: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments history
router.get('/history/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    // TODO: Fetch from Catalyst
    res.json({ payments: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
