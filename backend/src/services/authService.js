const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// In-memory OTP store (in production, use Catalyst/Redis)
const otpStore = new Map();
const tokenStore = new Map();

class AuthService {
  // Generate and send OTP
  async sendOTP(phone) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(phone, { otp, expiresAt });

    console.log(`OTP for ${phone}: ${otp}`); // TODO: Send via SMS/email

    return { success: true, phone };
  }

  // Verify OTP
  async verifyOTP(phone, otp) {
    const storedData = otpStore.get(phone);

    if (!storedData) {
      throw new Error('OTP expired or not found');
    }

    if (storedData.otp !== otp) {
      throw new Error('Invalid OTP');
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phone);
      throw new Error('OTP expired');
    }

    otpStore.delete(phone);
    return { success: true };
  }

  // Generate JWT token
  generateToken(userId, role) {
    const token = jwt.sign(
      { userId, role, id: uuidv4() },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '30d' }
    );

    tokenStore.set(userId, { token, role });
    return token;
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    } catch (err) {
      throw new Error('Invalid token');
    }
  }

  // Get user from token
  getUserFromToken(token) {
    const decoded = this.verifyToken(token);
    return decoded;
  }
}

module.exports = new AuthService();
