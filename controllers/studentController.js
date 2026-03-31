const fs = require('fs');
const csv = require('csv-parser');
const { sequelize, Student, Team, TeamMember, Tutor, Batch } = require('../models');
const { Op } = require('sequelize');

const DEFAULT_CSV_STUDENT_PASSWORD = 'password123';

/**
 * Upload CSV file containing student data and automatically create teams
 * @route POST /api/students/upload
 * @param {File} req.file - CSV file with columns: name, email
 * @param {Number} req.body.tutor_id - ID of the tutor supervising the teams
 * @param {Number} req.body.batch_id - ID of the batch the students belong to
 * @param {Number} req.body.group_size - Number of students per team
 */
const uploadStudentCSV = async (req, res) => {
  // Start transaction
  const transaction = await sequelize.transaction();

  try {
    // Validation: Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }

    // Validation: Check required fields
    const { tutor_id, batch_id, group_size } = req.body;

    if (!tutor_id || !batch_id || !group_size) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: tutor_id, batch_id, and group_size are required'
      });
    }

    // Convert to numbers and validate
    const tutorId = parseInt(tutor_id);
    const batchId = parseInt(batch_id);
    const groupSize = parseInt(group_size);

    if (isNaN(tutorId) || isNaN(batchId) || isNaN(groupSize) || groupSize < 1) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Invalid tutor_id, batch_id, or group_size. Group size must be at least 1.'
      });
    }

    // Verify tutor exists
    const tutor = await Tutor.findByPk(tutorId, { transaction });
    if (!tutor) {
      await transaction.rollback();
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: `Tutor with ID ${tutorId} not found`
      });
    }

    // Verify batch exists
    const batch = await Batch.findByPk(batchId, { transaction });
    if (!batch) {
      await transaction.rollback();
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: `Batch with ID ${batchId} not found`
      });
    }

    // Parse CSV file
    const students = [];
    const errors = [];
    const filePath = req.file.path;

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Validate row data
          const name = row.name?.trim();
          const email = row.email?.trim().toLowerCase();

          if (!name || !email) {
            errors.push(`Invalid row: missing name or email - ${JSON.stringify(row)}`);
            return;
          }

          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            errors.push(`Invalid email format: ${email}`);
            return;
          }

          students.push({ name, email });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Clean up CSV file after parsing
    fs.unlinkSync(filePath);

    // Check if any students were parsed
    if (students.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No valid student records found in CSV',
        errors: errors.length > 0 ? errors : undefined
      });
    }

    // Check for duplicate emails in the CSV
    const emailSet = new Set();
    const duplicates = [];
    students.forEach(student => {
      if (emailSet.has(student.email)) {
        duplicates.push(student.email);
      }
      emailSet.add(student.email);
    });

    if (duplicates.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Duplicate emails found in CSV',
        duplicates: [...new Set(duplicates)]
      });
    }

    // Check for existing emails in database
    const existingEmails = await Student.findAll({
      where: {
        email: students.map(s => s.email)
      },
      attributes: ['email'],
      transaction
    });

    if (existingEmails.length > 0) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Some students already exist in the database',
        existingEmails: existingEmails.map(s => s.email)
      });
    }

    // Create student records
    const createdStudents = await Student.bulkCreate(
      students.map(student => ({
        ...student,
        password: DEFAULT_CSV_STUDENT_PASSWORD,
        batch_id: batchId
      })),
      { 
        transaction,
        validate: true,
        individualHooks: true
      }
    );

    console.log(`✅ Created ${createdStudents.length} students`);

    // Shuffle students to ensure random team assignment
    const shuffledStudents = [...createdStudents].sort(() => Math.random() - 0.5);

    // Divide students into groups
    const teams = [];
    const numberOfTeams = Math.ceil(shuffledStudents.length / groupSize);

    for (let i = 0; i < numberOfTeams; i++) {
      const startIndex = i * groupSize;
      const endIndex = Math.min(startIndex + groupSize, shuffledStudents.length);
      const teamMembers = shuffledStudents.slice(startIndex, endIndex);
      
      teams.push({
        members: teamMembers,
        teamName: `Team ${i + 1} - ${batch.department} ${batch.year}`
      });
    }

    // Create Team records and link students
    const createdTeams = [];
    const teamMemberRecords = [];

    for (const teamData of teams) {
      // Create team
      const team = await Team.create({
        team_name: teamData.teamName,
        tutor_id: tutorId
      }, { transaction });

      createdTeams.push({
        team_id: team.team_id,
        team_name: team.team_name,
        member_count: teamData.members.length,
        members: teamData.members.map(m => ({
          student_id: m.student_id,
          name: m.name,
          email: m.email
        }))
      });

      // Create Team_Member junction records
      for (const member of teamData.members) {
        teamMemberRecords.push({
          team_id: team.team_id,
          student_id: member.student_id
        });
      }
    }

    // Bulk insert all team member associations
    await TeamMember.bulkCreate(teamMemberRecords, { transaction });

    console.log(`✅ Created ${createdTeams.length} teams`);
    console.log(`✅ Created ${teamMemberRecords.length} team member associations`);

    // Commit transaction
    await transaction.commit();

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Students uploaded and teams created successfully',
      data: {
        students_created: createdStudents.length,
        teams_created: createdTeams.length,
        batch_info: {
          batch_id: batch.batch_id,
          year: batch.year,
          department: batch.department
        },
        tutor_info: {
          tutor_id: tutor.tutor_id,
          name: tutor.name,
          email: tutor.email
        },
        teams: createdTeams
      },
      warnings: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();

    // Clean up file if it still exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('❌ Error in uploadStudentCSV:', error);

    // Handle specific Sequelize errors
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
        message: 'Duplicate entry detected',
        errors: error.errors.map(e => ({
          field: e.path,
          value: e.value,
          message: e.message
        }))
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing the CSV file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get student's team information
 * @route GET /api/students/my-team
 * @access Student only
 */
const getMyTeam = async (req, res) => {
  try {
    const student_id = req.user.id;

    // Find the team member record
    const teamMember = await TeamMember.findOne({
      where: { student_id },
      include: [
        {
          model: Team,
          include: [
            {
              model: Student,
              through: { attributes: [] },
              attributes: ['student_id', 'name', 'email']
            },
            {
              model: Tutor,
              attributes: ['tutor_id', 'name', 'email', 'department']
            }
          ]
        }
      ]
    });

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'You are not assigned to any team yet'
      });
    }

    res.json({
      success: true,
      data: teamMember.Team
    });
  } catch (error) {
    console.error('Get my team error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get student's team submissions
 * @route GET /api/students/my-submissions
 * @access Student only
 */
const getMySubmissions = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { Submission, TaskPhase, IndividualGrade } = require('../models');

    // Find student's team
    const teamMember = await TeamMember.findOne({
      where: { student_id },
      attributes: ['team_id']
    });

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'You are not assigned to any team yet'
      });
    }

    // Get all submissions for the team
    const submissions = await Submission.findAll({
      where: { team_id: teamMember.team_id },
      include: [
        {
          model: TaskPhase,
          attributes: ['phase_id', 'title', 'description', 'start_date', 'end_date']
        },
        {
          model: IndividualGrade,
          where: { student_id },
          required: false,
          attributes: [
            ['marks_awarded', 'individual_marks'],
            'tutor_feedback'
          ]
        }
      ],
      order: [['submitted_at', 'DESC']]
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all phases assigned to student's team
 * @route GET /api/students/team-phases
 * @access Student only
 */
const getTeamPhases = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { TaskPhase, Submission } = require('../models');

    const student = await Student.findByPk(student_id, {
      attributes: ['student_id', 'batch_id']
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find student's team
    const teamMember = await TeamMember.findOne({
      where: { student_id },
      include: [
        {
          model: Team,
          attributes: ['team_id', 'tutor_id']
        }
      ]
    });

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'You are not assigned to any team yet'
      });
    }

    // Get all phases created by the team's tutor
    const phases = await TaskPhase.findAll({
      where: {
        tutor_id: teamMember.Team.tutor_id,
        [Op.or]: [
          { batch_id: null },
          { batch_id: student.batch_id }
        ]
      },
      include: [
        {
          model: Submission,
          where: { team_id: teamMember.team_id },
          required: false,
          attributes: ['submission_id', 'title', 'submission_text', 'submitted_at', 'group_marks', 'ai_similarity_flag', 'team_id'],
          include: [
            {
              model: Team,
              attributes: ['team_id', 'team_name']
            }
          ]
        }
      ],
      order: [['start_date', 'DESC']]
    });

    res.json({
      success: true,
      data: phases
    });
  } catch (error) {
    console.error('Get team phases error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching phases',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get list of batches available for registration
 * @route GET /api/students/batches
 * @access Public
 */
const getAvailableBatches = async (req, res) => {
  try {
    const batches = await Batch.findAll({
      order: [['year', 'DESC'], ['department', 'ASC']]
    });

    res.json({
      success: true,
      count: batches.length,
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

module.exports = {
  uploadStudentCSV,
  getMyTeam,
  getMySubmissions,
  getTeamPhases,
  getAvailableBatches
};
