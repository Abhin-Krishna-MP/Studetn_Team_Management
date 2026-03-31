const { TaskPhase, Team, Submission, Student, Batch, TeamMember } = require('../models');

/**
 * Create a new task phase
 * @route POST /api/tutor/phases
 * @access Tutor only
 */
const createPhase = async (req, res) => {
  try {
    const { title, description, start_date, end_date, batch_id, apply_to_all_batches } = req.body;
    const tutor_id = req.user.id;

    // Validation
    if (!title || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date, and end date are required'
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start_date or end_date'
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be before start date'
      });
    }

    const shouldApplyToAllBatches =
      apply_to_all_batches === true ||
      apply_to_all_batches === 'true' ||
      apply_to_all_batches === 1 ||
      apply_to_all_batches === '1';

    let resolvedBatchId = null;

    // Backward compatible behavior:
    // - If apply_to_all_batches is true => common phase (batch_id = null)
    // - If apply_to_all_batches is false => batch_id required
    // - If apply_to_all_batches not provided => batch_id decides scope
    const hasBatchProvided = batch_id !== undefined && batch_id !== null && batch_id !== '';

    if (apply_to_all_batches !== undefined && !shouldApplyToAllBatches && !hasBatchProvided) {
      return res.status(400).json({
        success: false,
        message: 'batch_id is required when creating a batch-specific phase'
      });
    }

    if (!shouldApplyToAllBatches && hasBatchProvided) {
      const parsedBatchId = parseInt(batch_id, 10);
      if (Number.isNaN(parsedBatchId)) {
        return res.status(400).json({
          success: false,
          message: 'batch_id must be a valid number'
        });
      }

      const batch = await Batch.findByPk(parsedBatchId);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: `Batch with ID ${parsedBatchId} not found`
        });
      }

      resolvedBatchId = parsedBatchId;
    }

    // Create phase
    const phase = await TaskPhase.create({
      tutor_id,
      batch_id: resolvedBatchId,
      title,
      description: description || '',
      start_date: startDate,
      end_date: endDate
    });

    res.status(201).json({
      success: true,
      message: 'Phase created successfully',
      data: phase
    });
  } catch (error) {
    console.error('Create phase error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating phase',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all phases for the logged-in tutor
 * @route GET /api/tutor/phases
 * @access Tutor only
 */
const getTutorPhases = async (req, res) => {
  try {
    const tutor_id = req.user.id;

    const [phases, teams] = await Promise.all([
      TaskPhase.findAll({
        where: { tutor_id },
        include: [
          {
            model: Batch,
            attributes: ['batch_id', 'year', 'department', 'branch', 'section'],
            required: false
          },
          {
            model: Submission,
            attributes: ['submission_id', 'team_id', 'group_marks', 'ai_similarity_flag', 'submitted_at']
          }
        ],
        order: [['start_date', 'DESC']]
      }),
      Team.findAll({
        where: { tutor_id },
        attributes: ['team_id'],
        include: [
          {
            model: Student,
            through: { attributes: [] },
            attributes: ['student_id', 'batch_id']
          }
        ]
      })
    ]);

    const totalTeams = teams.length;
    const teamBatchMap = new Map();

    teams.forEach((team) => {
      const batchIds = new Set((team.Students || []).map((student) => student.batch_id).filter(Boolean));
      teamBatchMap.set(team.team_id, batchIds);
    });

    const normalizedPhases = phases.map((phase) => {
      const submissions = phase.Submissions || [];
      const graded = submissions.filter((sub) => sub.group_marks !== null).length;
      const flagged = submissions.filter((sub) => sub.ai_similarity_flag).length;
      const isCommonPhase = !phase.batch_id;
      const eligibleTeams = isCommonPhase
        ? totalTeams
        : teams.filter((team) => teamBatchMap.get(team.team_id)?.has(phase.batch_id)).length;

      return {
        phase_id: phase.phase_id,
        batch_id: phase.batch_id,
        batch: phase.Batch
          ? {
              batch_id: phase.Batch.batch_id,
              year: phase.Batch.year,
              department: phase.Batch.department,
              branch: phase.Batch.branch,
              section: phase.Batch.section
            }
          : null,
        scope: isCommonPhase ? 'all_batches' : 'specific_batch',
        title: phase.title,
        description: phase.description,
        start_date: phase.start_date,
        end_date: phase.end_date,
        stats: {
          submissions: submissions.length,
          graded,
          flagged,
          totalTeams: eligibleTeams
        }
      };
    });

    res.json({
      success: true,
      data: normalizedPhases,
      meta: {
        totalTeams
      }
    });
  } catch (error) {
    console.error('Get tutor phases error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching phases',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all teams supervised by the tutor
 * @route GET /api/tutor/teams
 * @access Tutor only
 */
const getTutorTeams = async (req, res) => {
  try {
    const tutor_id = req.user.id;

    const teams = await Team.findAll({
      where: { tutor_id },
      include: [
        {
          model: Student,
          through: { attributes: [] },
          attributes: ['student_id', 'name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('Get tutor teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teams',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fetch overview metrics for tutor dashboard
 * @route GET /api/tutor/overview
 * @access Tutor only
 */
const getTutorOverview = async (req, res) => {
  try {
    const tutor_id = req.user.id;
    const now = new Date();

    const [teams, phases, submissions] = await Promise.all([
      Team.findAll({
        where: { tutor_id },
        include: [{
          model: Student,
          through: { attributes: [] },
          attributes: ['student_id', 'name', 'email']
        }]
      }),
      TaskPhase.findAll({
        where: { tutor_id },
        order: [['start_date', 'ASC']]
      }),
      Submission.findAll({
        include: [
          {
            model: TaskPhase,
            where: { tutor_id },
            attributes: ['phase_id', 'title', 'start_date', 'end_date']
          },
          {
            model: Team,
            attributes: ['team_id', 'team_name']
          }
        ],
        order: [['submitted_at', 'DESC']]
      })
    ]);

    const studentIds = new Set();
    teams.forEach(team => {
      team.Students.forEach(student => studentIds.add(student.student_id));
    });

    const activePhases = phases.filter(phase => {
      const start = new Date(phase.start_date);
      const end = new Date(phase.end_date);
      return now >= start && now <= end;
    }).length;

    const upcomingPhases = phases.filter(phase => {
      const start = new Date(phase.start_date);
      return start > now;
    }).length;

    const gradedSubmissions = submissions.filter(sub => sub.group_marks !== null);
    const averageScore = gradedSubmissions.length > 0
      ? Math.round(
          gradedSubmissions.reduce((sum, sub) => sum + sub.group_marks, 0) / gradedSubmissions.length
        )
      : null;

    const recentActivity = submissions.slice(0, 5).map(sub => ({
      submission_id: sub.submission_id,
      team_name: sub.Team?.team_name,
      phase_title: sub.Task_Phase?.title,
      submitted_at: sub.submitted_at,
      group_marks: sub.group_marks,
      ai_similarity_flag: sub.ai_similarity_flag
    }));

    res.json({
      success: true,
      data: {
        totals: {
          teams: teams.length,
          students: studentIds.size,
          phases: phases.length,
          activePhases,
          upcomingPhases,
          submissions: submissions.length,
          averageScore
        },
        recentActivity,
        phases,
        teams: teams.map(team => ({
          team_id: team.team_id,
          team_name: team.team_name,
          member_count: team.Students.length
        }))
      }
    });
  } catch (error) {
    console.error('Get tutor overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tutor overview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all submissions for a specific phase
 * @route GET /api/tutor/phases/:phase_id/submissions
 * @access Tutor only
 */
const getPhaseSubmissions = async (req, res) => {
  try {
    const { phase_id } = req.params;
    const tutor_id = req.user.id;

    // Verify phase belongs to tutor
    const phase = await TaskPhase.findOne({
      where: { phase_id, tutor_id }
    });

    if (!phase) {
      return res.status(404).json({
        success: false,
        message: 'Phase not found or access denied'
      });
    }

    const submissions = await Submission.findAll({
      where: { phase_id },
      include: [
        {
          model: Team,
          include: [
            {
              model: Student,
              through: { attributes: [] },
              attributes: ['student_id', 'name', 'email']
            }
          ]
        }
      ],
      order: [['submitted_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        phase,
        submissions
      }
    });
  } catch (error) {
    console.error('Get phase submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update submission grade
 * @route PUT /api/tutor/submissions/:submission_id/grade
 * @access Tutor only
 */
const gradeSubmission = async (req, res) => {
  try {
    const { submission_id } = req.params;
    const { group_marks } = req.body;
    const tutor_id = req.user.id;

    // Validation
    if (group_marks === undefined || group_marks < 0 || group_marks > 100) {
      return res.status(400).json({
        success: false,
        message: 'Valid group marks (0-100) are required'
      });
    }

    // Find submission and verify tutor ownership
    const submission = await Submission.findOne({
      where: { submission_id },
      include: [
        {
          model: TaskPhase,
          where: { tutor_id }
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found or access denied'
      });
    }

    // Update grade
    submission.group_marks = group_marks;
    await submission.save();

    res.json({
      success: true,
      message: 'Grade updated successfully',
      data: submission
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating grade',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete a phase
 * @route DELETE /api/tutor/phases/:phase_id
 * @access Tutor only
 */
const deletePhase = async (req, res) => {
  try {
    const { phase_id } = req.params;
    const tutor_id = req.user.id;

    // Find phase and verify ownership
    const phase = await TaskPhase.findOne({
      where: { phase_id, tutor_id }
    });

    if (!phase) {
      return res.status(404).json({
        success: false,
        message: 'Phase not found or access denied'
      });
    }

    await phase.destroy();

    res.json({
      success: true,
      message: 'Phase deleted successfully'
    });
  } catch (error) {
    console.error('Delete phase error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting phase',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a batch
 * @route POST /api/tutor/batches
 * @access Tutor only
 */
const createBatch = async (req, res) => {
  try {
    const { year, department, branch, section } = req.body;

    // Validation
    if (!year || !department) {
      return res.status(400).json({
        success: false,
        message: 'Year and department are required'
      });
    }

    const parsedYear = parseInt(year, 10);
    if (Number.isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid batch year'
      });
    }

    // Create batch
    const batch = await Batch.create({
      year: parsedYear,
      department: department.trim(),
      branch: branch ? branch.trim() : null,
      section: section ? section.trim() : null
    });

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: batch
    });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating batch',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all batches
 * @route GET /api/tutor/batches
 * @access Tutor only
 */
const getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.findAll({
      order: [['year', 'DESC'], ['department', 'ASC'], ['section', 'ASC']]
    });

    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching batches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a new team
 * @route POST /api/tutor/teams
 * @access Tutor only
 */
const createTeam = async (req, res) => {
  try {
    const { team_name, student_ids } = req.body;
    const tutor_id = req.user.id;

    // Validation
    if (!team_name) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one student ID is required'
      });
    }

    // Verify all students exist
    const students = await Student.findAll({
      where: { student_id: student_ids }
    });

    if (students.length !== student_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more student IDs are invalid'
      });
    }

    // Create team
    const team = await Team.create({
      team_name,
      tutor_id
    });

    // Add team members
    const { TeamMember } = require('../models');
    const teamMemberRecords = student_ids.map(student_id => ({
      team_id: team.team_id,
      student_id
    }));

    await TeamMember.bulkCreate(teamMemberRecords);

    // Fetch complete team with members
    const completeTeam = await Team.findByPk(team.team_id, {
      include: [
        {
          model: Student,
          through: { attributes: [] },
          attributes: ['student_id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: completeTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating team',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all students available for team assignment
 * @route GET /api/tutor/students
 * @access Tutor only
 */
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      attributes: ['student_id', 'name', 'email', 'batch_id'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
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
};
