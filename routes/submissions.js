const express = require('express');
const router = express.Router();
const { 
  submitFinalSubmission, 
  getSubmissionsByPhase,
  getSubmissionById 
} = require('../controllers/submissionController');

/**
 * @route   POST /api/submissions
 * @desc    Submit final project submission with AI analysis
 * @access  Public (add authentication as needed)
 * @body    team_id, phase_id, submission_text, file_url (optional)
 */
router.post('/', submitFinalSubmission);

/**
 * @route   GET /api/submissions/phase/:phase_id
 * @desc    Get all submissions for a specific phase
 * @access  Public (add authentication as needed)
 */
router.get('/phase/:phase_id', getSubmissionsByPhase);

/**
 * @route   GET /api/submissions/:submission_id
 * @desc    Get submission details by ID
 * @access  Public (add authentication as needed)
 */
router.get('/:submission_id', getSubmissionById);

module.exports = router;
