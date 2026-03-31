const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { 
  uploadStudentCSV, 
  getMyTeam, 
  getMySubmissions,
  getTeamPhases,
  getAvailableBatches
} = require('../controllers/studentController');
const { authenticate, isStudent, isTutor } = require('../middleware/auth');

/**
 * @route   POST /api/students/upload
 * @desc    Upload CSV file to create students and auto-generate teams
 * @access  Public (add authentication middleware as needed)
 * @body    tutor_id (Number), batch_id (Number), group_size (Number)
 * @file    CSV with columns: name, email
 */
router.post('/upload', authenticate, isTutor, upload.single('file'), uploadStudentCSV);

// Public helper routes
router.get('/batches', getAvailableBatches);

// Protected student routes
router.get('/my-team', authenticate, isStudent, getMyTeam);
router.get('/my-submissions', authenticate, isStudent, getMySubmissions);
router.get('/team-phases', authenticate, isStudent, getTeamPhases);

module.exports = router;
