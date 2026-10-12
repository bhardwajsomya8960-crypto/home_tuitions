const express = require('express');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const catalyst = require('../config/catalyst');

const router = express.Router();

// Send OTP to phone/email
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, email } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ error: 'Phone or email required' });
    }

    const contact = phone || email;
    await authService.sendOTP(contact);

    // Send OTP via email if provided
    if (email) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // await emailService.sendOTPEmail(email, otp);
      console.log(`OTP for ${email}: ${otp}`);
    }

    res.json({
      success: true,
      message: 'OTP sent',
      contact
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, email, otp, role, userType } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP required' });
    }

    const contact = phone || email;
    await authService.verifyOTP(contact, otp);

    // Generate token
    const token = authService.generateToken(contact, role || userType);

    res.json({
      success: true,
      token,
      user: {
        contact,
        role: role || userType
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify token
router.post('/verify-token', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    const user = authService.getUserFromToken(token);
    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

module.exports = router;
