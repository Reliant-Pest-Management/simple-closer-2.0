// src/routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const companyRoutes = require('./company.routes');
const serviceRoutes = require('./service.routes');
const quoteRoutes = require('./quote.routes');
const checkoutRoutes = require('./checkout.routes');

// Auth middleware for protected routes
const { authenticate } = require('../middleware/auth.middleware');

// Public routes
router.use('/auth', authRoutes);
router.use('/checkout', checkoutRoutes); // Customer-facing checkout

// Protected routes (require authentication)
router.use('/companies', authenticate, companyRoutes);
router.use('/services', authenticate, serviceRoutes);
router.use('/quotes', authenticate, quoteRoutes);

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Simple Closer API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      checkout: '/api/checkout',
      companies: '/api/companies',
      services: '/api/services',
      quotes: '/api/quotes',
    },
  });
});

module.exports = router;