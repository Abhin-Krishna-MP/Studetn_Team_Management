const express = require('express');
const router = express.Router();
const {
  registerStudent,
  loginStudent,
  registerTutor,
  loginTutor,
  getCurrentUser
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Student routes
router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);

// Tutor routes
router.post('/tutor/register', registerTutor);
router.post('/tutor/login', loginTutor);

// Get current user (requires authentication)
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
