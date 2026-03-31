const jwt = require('jsonwebtoken');
const { Student, Tutor, Batch } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Student Registration
 * @route POST /api/auth/student/register
 */
const registerStudent = async (req, res) => {
  try {
    const { name, email, password, batch_id } = req.body;

    // Validation
    if (!name || !email || !password || !batch_id) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ where: { email } });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    // Check if batch exists
    const batch = await Batch.findByPk(batch_id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Create student
    const student = await Student.create({
      name,
      email,
      password,
      batch_id
    });

    // Generate token
    const token = jwt.sign(
      { id: student.student_id, role: 'student' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
        token,
        user: {
          id: student.student_id,
          name: student.name,
          email: student.email,
          role: 'student',
          batch_id: student.batch_id
        }
      }
    });
  } catch (error) {
    console.error('Register student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering student',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Student Login
 * @route POST /api/auth/student/login
 */
const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find student
    const student = await Student.findOne({ where: { email } });
    if (!student || !student.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: student.student_id, role: 'student' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: student.student_id,
          name: student.name,
          email: student.email,
          role: 'student',
          batch_id: student.batch_id
        }
      }
    });
  } catch (error) {
    console.error('Login student error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Tutor Registration
 * @route POST /api/auth/tutor/register
 */
const registerTutor = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    // Validation
    if (!name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if tutor already exists
    const existingTutor = await Tutor.findOne({ where: { email } });
    if (existingTutor) {
      return res.status(409).json({
        success: false,
        message: 'Tutor with this email already exists'
      });
    }

    // Create tutor
    const tutor = await Tutor.create({
      name,
      email,
      password,
      department
    });

    // Generate token
    const token = jwt.sign(
      { id: tutor.tutor_id, role: 'tutor' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Tutor registered successfully',
      data: {
        token,
        user: {
          id: tutor.tutor_id,
          name: tutor.name,
          email: tutor.email,
          role: 'tutor',
          department: tutor.department
        }
      }
    });
  } catch (error) {
    console.error('Register tutor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering tutor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Tutor Login
 * @route POST /api/auth/tutor/login
 */
const loginTutor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find tutor
    const tutor = await Tutor.findOne({ where: { email } });
    if (!tutor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await tutor.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: tutor.tutor_id, role: 'tutor' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: tutor.tutor_id,
          name: tutor.name,
          email: tutor.email,
          role: 'tutor',
          department: tutor.department
        }
      }
    });
  } catch (error) {
    console.error('Login tutor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get current user info
 * @route GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
};

module.exports = {
  registerStudent,
  loginStudent,
  registerTutor,
  loginTutor,
  getCurrentUser
};
