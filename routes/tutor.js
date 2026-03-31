const express = require('express');
const router = express.Router();
const {
  createPhase,
  getTutorPhases,
  getTutorTeams,
  getPhaseSubmissions,
  gradeSubmission,
  deletePhase,
  createBatch,
  getAllBatches,
  createTeam,
  getAllStudents,
  getTutorOverview
} = require('../controllers/tutorController');
const { authenticate, isTutor, isStudent } = require('../middleware/auth');

// All tutor routes require authentication and tutor role
router.use(authenticate);
router.use(isTutor);

// Overview
router.get('/overview', getTutorOverview);

// Phase management
router.post('/phases', createPhase);
router.get('/phases', getTutorPhases);
router.delete('/phases/:phase_id', deletePhase);
router.get('/phases/:phase_id/submissions', getPhaseSubmissions);

// Team management
router.get('/teams', getTutorTeams);
router.post('/teams', createTeam);

// Student management
router.get('/students', getAllStudents);

// Grading
router.put('/submissions/:submission_id/grade', gradeSubmission);

// Batch management
router.post('/batches', createBatch);
router.get('/batches', getAllBatches);

module.exports = router;
