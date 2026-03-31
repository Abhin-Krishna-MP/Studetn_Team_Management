const { sequelize, DraftCommit, Student, Submission, TeamMember, Team, TaskPhase } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a new draft commit
 * @route POST /api/drafts
 * @desc Save a draft commit when student saves in the text editor
 * @body student_id, submission_id OR (team_id + phase_id), lines_added, lines_deleted
 */
const createDraftCommit = async (req, res) => {
  try {
    const { submission_id, team_id, phase_id, lines_added, lines_deleted, content, title } = req.body;
    const student_id = req.body.student_id || req.user?.id;

    if (req.user?.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can create draft commits'
      });
    }

    // Validation - need either submission_id or (team_id + phase_id)
    if (!student_id || (!submission_id && (!team_id || !phase_id))) {
      return res.status(400).json({
        success: false,
        message: 'student_id and either submission_id or (team_id + phase_id) are required'
      });
    }

    // Convert to numbers
    const studentId = parseInt(student_id);
    let submissionId = submission_id ? parseInt(submission_id) : null;
    const linesAdded = parseInt(lines_added) || 0;
    const linesDeleted = parseInt(lines_deleted) || 0;

    // Validate numeric values
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'student_id must be a valid number'
      });
    }

    if (linesAdded < 0 || linesDeleted < 0) {
      return res.status(400).json({
        success: false,
        message: 'lines_added and lines_deleted cannot be negative'
      });
    }

    // If submission_id not provided, find or create submission
    if (!submissionId) {
      const teamId = parseInt(team_id);
      const phaseId = parseInt(phase_id);

      if (isNaN(teamId) || isNaN(phaseId)) {
        return res.status(400).json({
          success: false,
          message: 'team_id and phase_id must be valid numbers'
        });
      }

      // Verify team exists
      const team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: `Team with ID ${teamId} not found`
        });
      }

      // Verify phase exists
      const phase = await TaskPhase.findByPk(phaseId);
      if (!phase) {
        return res.status(404).json({
          success: false,
          message: `Task phase with ID ${phaseId} not found`
        });
      }

      // Find or create submission for this team and phase
      let submission = await Submission.findOne({
        where: {
          team_id: teamId,
          phase_id: phaseId
        }
      });

      if (!submission) {
        // Create a draft submission
        submission = await Submission.create({
          team_id: teamId,
          phase_id: phaseId,
          title: title || null,
          submission_text: content || '',
          file_url: 'draft',
          submitted_at: null,
          ai_summary: 'Draft in progress',
          ai_similarity_flag: false,
          group_marks: null
        });
      } else if (content !== undefined || title !== undefined) {
        submission.title = title !== undefined ? title : submission.title;
        submission.submission_text = content !== undefined ? content : submission.submission_text;
        await submission.save();
      }

      submissionId = submission.submission_id;
    }

    // Validate submission_id
    if (isNaN(submissionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission_id'
      });
    }

    // Verify student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with ID ${studentId} not found`
      });
    }

    // Verify submission exists
    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: `Submission with ID ${submissionId} not found`
      });
    }

    // Verify student is part of the team that owns this submission
    const teamMember = await TeamMember.findOne({
      where: {
        student_id: studentId,
        team_id: submission.team_id
      }
    });

    if (!teamMember) {
      return res.status(403).json({
        success: false,
        message: 'Student is not a member of the team for this submission'
      });
    }

    if (content !== undefined || title !== undefined) {
      submission.title = title !== undefined ? title : submission.title;
      submission.submission_text = content !== undefined ? content : submission.submission_text;
      await submission.save();
    }

    // Create draft commit
    const draftCommit = await DraftCommit.create({
      student_id: studentId,
      submission_id: submissionId,
      lines_added: linesAdded,
      lines_deleted: linesDeleted,
      timestamp: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Draft commit recorded successfully',
      data: {
        commit_id: draftCommit.commit_id,
        student_id: draftCommit.student_id,
        submission_id: draftCommit.submission_id,
        lines_added: draftCommit.lines_added,
        lines_deleted: draftCommit.lines_deleted,
        total_lines_changed: draftCommit.lines_added + draftCommit.lines_deleted,
        timestamp: draftCommit.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Error in createDraftCommit:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred while recording draft commit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get velocity heatmap data for a team and phase
 * @route GET /api/teams/:team_id/velocity/:phase_id
 * @desc Aggregate draft commits by student for timeline visualization
 */
const getTeamVelocity = async (req, res) => {
  try {
    const { team_id, phase_id } = req.params;

    // Convert to numbers
    const teamId = parseInt(team_id);
    const phaseId = parseInt(phase_id);

    // Validation
    if (isNaN(teamId) || isNaN(phaseId)) {
      return res.status(400).json({
        success: false,
        message: 'team_id and phase_id must be valid numbers'
      });
    }

    // Verify team exists
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: `Team with ID ${teamId} not found`
      });
    }

    // Verify phase exists
    const phase = await TaskPhase.findByPk(phaseId);
    if (!phase) {
      return res.status(404).json({
        success: false,
        message: `Task phase with ID ${phaseId} not found`
      });
    }

    // Get all submissions for this team and phase
    const submissions = await Submission.findAll({
      where: {
        team_id: teamId,
        phase_id: phaseId
      },
      attributes: ['submission_id']
    });

    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No submissions found for this team and phase'
      });
    }

    const submissionIds = submissions.map(s => s.submission_id);

    // Get all draft commits for these submissions with student info
    const draftCommits = await DraftCommit.findAll({
      where: {
        submission_id: {
          [Op.in]: submissionIds
        }
      },
      include: [
        {
          model: Student,
          attributes: ['student_id', 'name', 'email']
        }
      ],
      order: [['timestamp', 'ASC']]
    });

    if (draftCommits.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No draft commits found for this team and phase',
        data: {
          team_id: teamId,
          phase_id: phaseId,
          team_name: team.team_name,
          phase_title: phase.title,
          students: [],
          timeline: [],
          summary: {
            total_commits: 0,
            total_lines_added: 0,
            total_lines_deleted: 0,
            total_lines_changed: 0
          }
        }
      });
    }

    // Get team members for this team
    const teamMembers = await TeamMember.findAll({
      where: { team_id: teamId },
      include: [
        {
          model: Student,
          attributes: ['student_id', 'name', 'email']
        }
      ]
    });

    // Aggregate data by student
    const studentStats = {};
    const timelineData = [];

    draftCommits.forEach(commit => {
      const studentId = commit.student_id;
      const student = commit.Student;
      const linesChanged = commit.lines_added + commit.lines_deleted;

      // Initialize student stats if not exists
      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          student_id: studentId,
          name: student.name,
          email: student.email,
          total_commits: 0,
          total_lines_added: 0,
          total_lines_deleted: 0,
          total_lines_changed: 0,
          first_commit: commit.timestamp,
          last_commit: commit.timestamp
        };
      }

      // Update student stats
      studentStats[studentId].total_commits += 1;
      studentStats[studentId].total_lines_added += commit.lines_added;
      studentStats[studentId].total_lines_deleted += commit.lines_deleted;
      studentStats[studentId].total_lines_changed += linesChanged;
      studentStats[studentId].last_commit = commit.timestamp;

      // Add to timeline data (formatted for charting libraries)
      timelineData.push({
        timestamp: commit.timestamp,
        date: commit.timestamp.toISOString().split('T')[0], // YYYY-MM-DD
        time: commit.timestamp.toISOString(), // Full ISO timestamp
        hour: commit.timestamp.getHours(),
        student_id: studentId,
        student_name: student.name,
        lines_added: commit.lines_added,
        lines_deleted: commit.lines_deleted,
        lines_changed: linesChanged,
        commit_id: commit.commit_id
      });
    });

    // Calculate overall statistics
    const totalStats = {
      total_commits: draftCommits.length,
      total_lines_added: draftCommits.reduce((sum, c) => sum + c.lines_added, 0),
      total_lines_deleted: draftCommits.reduce((sum, c) => sum + c.lines_deleted, 0),
      total_lines_changed: draftCommits.reduce((sum, c) => sum + c.lines_added + c.lines_deleted, 0)
    };

    // Create hourly heatmap data (grouped by hour of day and student)
    const heatmapData = [];
    const hourlyActivity = {};

    timelineData.forEach(entry => {
      const key = `${entry.date}-${entry.hour}-${entry.student_id}`;
      
      if (!hourlyActivity[key]) {
        hourlyActivity[key] = {
          date: entry.date,
          hour: entry.hour,
          student_id: entry.student_id,
          student_name: entry.student_name,
          commits: 0,
          lines_changed: 0
        };
      }
      
      hourlyActivity[key].commits += 1;
      hourlyActivity[key].lines_changed += entry.lines_changed;
    });

    Object.values(hourlyActivity).forEach(entry => {
      heatmapData.push(entry);
    });

    // Include students with no commits
    const studentsArray = Object.values(studentStats);
    teamMembers.forEach(member => {
      if (!studentStats[member.student_id]) {
        studentsArray.push({
          student_id: member.Student.student_id,
          name: member.Student.name,
          email: member.Student.email,
          total_commits: 0,
          total_lines_added: 0,
          total_lines_deleted: 0,
          total_lines_changed: 0,
          first_commit: null,
          last_commit: null
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Velocity data retrieved successfully',
      data: {
        team_id: teamId,
        phase_id: phaseId,
        team_name: team.team_name,
        phase_title: phase.title,
        phase_dates: {
          start_date: phase.start_date,
          end_date: phase.end_date
        },
        students: studentsArray.sort((a, b) => b.total_lines_changed - a.total_lines_changed),
        timeline: timelineData,
        heatmap: heatmapData,
        summary: totalStats
      }
    });

  } catch (error) {
    console.error('❌ Error in getTeamVelocity:', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving velocity data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createDraftCommit,
  getTeamVelocity
};
