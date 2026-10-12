const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes placeholder
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'home-tution-api' });
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Lead routes
const leadRoutes = require('./routes/leads');
app.use('/api/leads', leadRoutes);

// Tutor routes
const tutorRoutes = require('./routes/tutors');
app.use('/api/tutors', tutorRoutes);

// Parent routes
const parentRoutes = require('./routes/parents');
app.use('/api/parents', parentRoutes);

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Demo routes
const demoRoutes = require('./routes/demos');
app.use('/api/demos', demoRoutes);

// Enrolment routes
const enrolmentRoutes = require('./routes/enrolments');
app.use('/api/enrolments', enrolmentRoutes);

// Class routes
const classRoutes = require('./routes/classes');
app.use('/api/classes', classRoutes);

// Payment routes
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`home tution API running on port ${PORT}`);
});

module.exports = app;
