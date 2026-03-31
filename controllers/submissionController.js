const { sequelize, Submission, Team, TaskPhase, Student, TeamMember, DraftCommit } = require('../models');
const { generateAISummary } = require('../utils/aiService');
const { checkCrossGroupSimilarity } = require('../utils/similarityChecker');

/**
 * Submit final project submission with AI analysis and plagiarism detection
 * @route POST /api/submissions
 * @desc Process and save final submission with AI summary and similarity check
 * @body team_id, phase_id, submission_text, file_url (optional)
 */
const submitFinalSubmission = async (req, res) => {
  // Start transaction for data consistency
  const transaction = await sequelize.transaction();

  try {
    const { team_id, phase_id, submission_text, file_url, title } = req.body;

    // ===== VALIDATION =====
    
    // Check required fields
    if (!team_id || !phase_id || !submission_text) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'team_id, phase_id, and submission_text are required'
      });
    }

    // Convert to numbers
    const teamId = parseInt(team_id);
    const phaseId = parseInt(phase_id);

    if (isNaN(teamId) || isNaN(phaseId)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'team_id and phase_id must be valid numbers'
      });
    }

    // Validate text length
    if (submission_text.trim().length < 100) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Submission text must be at least 100 characters'
      });
    }

    console.log(`📝 Processing submission for Team ${teamId}, Phase ${phaseId}...`);

    // ===== VERIFY ENTITIES EXIST =====

    // Ensure student belongs to team when submission initiated by student
    if (req.user?.role === 'student') {
      const membership = await TeamMember.findOne({
        where: {
          student_id: req.user.id,
          team_id: teamId
        }
      });

      if (!membership) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this team'
        });
      }
    }

    // Verify team exists
    const team = await Team.findByPk(teamId, { 
      transaction,
      include: [{
        model: Student,
        through: { attributes: [] },
        attributes: ['student_id', 'name', 'email']
      }]
    });

    if (!team) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: `Team with ID ${teamId} not found`
      });
    }

    // Verify phase exists
    const phase = await TaskPhase.findByPk(phaseId, { transaction });

    if (!phase) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: `Task phase with ID ${phaseId} not found`
      });
    }

    // Check if submission already exists for this team and phase
    const existingSubmission = await Submission.findOne({
      where: {
        team_id: teamId,
        phase_id: phaseId
      },
      transaction
    });

    if (existingSubmission && existingSubmission.submitted_at) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Submission already exists for this team and phase',
        existing_submission_id: existingSubmission.submission_id
      });
    }

    // Check if phase is still open (optional - uncomment to enforce deadlines)
    // const now = new Date();
    // if (now > phase.end_date) {
    //   await transaction.rollback();
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Submission deadline has passed',
    //     deadline: phase.end_date
    //   });
    // }

    console.log('✅ Validation passed. Starting analysis...');

    // ===== AI SUMMARY GENERATION =====
    
    console.log('🤖 Step 1/2: Generating AI summary...');
    const aiAnalysis = await generateAISummary(submission_text);
    
    // Create comprehensive AI summary
    const aiSummary = `
Summary: ${aiAnalysis.summary}

Contribution Balance Analysis:
${aiAnalysis.contributionAnalysis}

Balance Score: ${aiAnalysis.balanceScore}/10
${aiAnalysis.redFlags.length > 0 ? `\nRed Flags:\n- ${aiAnalysis.redFlags.join('\n- ')}` : ''}
`.trim();

    console.log('✅ AI summary generated');

    // ===== PLAGIARISM CHECK =====
    
    console.log('🔍 Step 2/2: Checking cross-group similarity...');
    const similarityCheck = await checkCrossGroupSimilarity(
      submission_text,
      phaseId,
      teamId // Exclude current team from comparison
    );

    const similarityFlag = similarityCheck.isSimilar;
    
    console.log(`${similarityFlag ? '⚠️ Similarity flag raised' : '✅ No plagiarism detected'}`);

    // ===== SAVE SUBMISSION =====

    console.log('💾 Saving submission to database...');

    let submission;

    if (existingSubmission) {
      existingSubmission.title = title || existingSubmission.title || null;
      existingSubmission.submission_text = submission_text;
      existingSubmission.file_url = file_url || existingSubmission.file_url || null;
      existingSubmission.submitted_at = new Date();
      existingSubmission.ai_summary = aiSummary;
      existingSubmission.ai_similarity_flag = similarityFlag;
      existingSubmission.group_marks = null;
      submission = await existingSubmission.save({ transaction });
    } else {
      submission = await Submission.create({
        team_id: teamId,
        phase_id: phaseId,
        title: title || null,
        submission_text,
        file_url: file_url || null,
        submitted_at: new Date(),
        ai_summary: aiSummary,
        ai_similarity_flag: similarityFlag,
        group_marks: null // To be assigned by tutor later
      }, { transaction });
    }

    // Ensure velocity timeline has at least one event for successful final submission.
    // This covers cases where students submit directly without using "Save Draft".
    if (req.user?.role === 'student' && req.user?.id) {
      const existingDraftCount = await DraftCommit.count({
        where: { submission_id: submission.submission_id },
        transaction
      });

      if (existingDraftCount === 0) {
        const nonEmptyLines = submission_text
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean).length;

        await DraftCommit.create({
          student_id: req.user.id,
          submission_id: submission.submission_id,
          timestamp: new Date(),
          lines_added: Math.max(nonEmptyLines, 1),
          lines_deleted: 0
        }, { transaction });
      }
    }

    console.log('✅ Submission saved successfully');

    // ===== COMMIT TRANSACTION =====
    
    await transaction.commit();

    // ===== PREPARE RESPONSE =====

    return res.status(201).json({
      success: true,
      message: 'Submission processed successfully',
      data: {
        submission_id: submission.submission_id,
        team_id: submission.team_id,
        team_name: team.team_name,
        phase_id: submission.phase_id,
        phase_title: phase.title,
        submitted_at: submission.submitted_at,
        file_url: submission.file_url,
        ai_analysis: {
          summary: aiAnalysis.summary,
          contribution_balance: aiAnalysis.contributionAnalysis,
          balance_score: aiAnalysis.balanceScore,
          red_flags: aiAnalysis.redFlags
        },
        similarity_check: {
          flagged: similarityFlag,
          max_similarity: similarityCheck.maxSimilarityPercentage || 0,
          threshold: similarityCheck.threshold || 80,
          similar_submissions: similarityCheck.similarSubmissions || [],
          message: similarityCheck.message
        },
        team_members: team.Students.map(s => ({
          student_id: s.student_id,
          name: s.name,
          email: s.email
        }))
      },
      warnings: similarityFlag 
        ? ['⚠️ High similarity detected with existing submission(s). Manual review recommended.']
        : []
    });

  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();

    console.error('❌ Error in submitFinalSubmission:', error);

    // Handle specific errors
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

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Duplicate submission detected',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing submission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all submissions for a specific phase
 * @route GET /api/submissions/phase/:phase_id
 * @desc Retrieve all submissions for a given phase
 */
const getSubmissionsByPhase = async (req, res) => {
  try {
    const { phase_id } = req.params;
    const phaseId = parseInt(phase_id);

    if (isNaN(phaseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phase_id'
      });
    }

    const submissions = await Submission.findAll({
      where: { phase_id: phaseId },
      include: [
        {
          model: Team,
          attributes: ['team_id', 'team_name']
        },
        {
          model: TaskPhase,
          attributes: ['phase_id', 'title', 'start_date', 'end_date']
        }
      ],
      order: [['submitted_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get submission by ID with full details
 * @route GET /api/submissions/:submission_id
 * @desc Retrieve detailed information about a specific submission
 */
const getSubmissionById = async (req, res) => {
  try {
    const { submission_id } = req.params;
    const submissionId = parseInt(submission_id);

    if (isNaN(submissionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission_id'
      });
    }

    const submission = await Submission.findByPk(submissionId, {
      include: [
        {
          model: Team,
          attributes: ['team_id', 'team_name'],
          include: [{
            model: Student,
            through: { attributes: [] },
            attributes: ['student_id', 'name', 'email']
          }]
        },
        {
          model: TaskPhase,
          attributes: ['phase_id', 'title', 'description', 'start_date', 'end_date']
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error fetching submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching submission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  submitFinalSubmission,
  getSubmissionsByPhase,
  getSubmissionById
};
