const express = require('express');
const router = express.Router();
const { createDraftCommit, getTeamVelocity } = require('../controllers/draftController');

/**
 * @route   POST /api/drafts
 * @desc    Record a draft commit when student saves in editor
 * @access  Public (add authentication as needed)
 * @body    student_id, submission_id, lines_added, lines_deleted
 */
router.post('/', createDraftCommit);

/**
 * @route   GET /api/teams/:team_id/velocity/:phase_id
 * @desc    Get velocity heatmap data for a team and phase
 * @access  Public (add authentication as needed)
 */
router.get('/teams/:team_id/velocity/:phase_id', getTeamVelocity);

module.exports = router;
