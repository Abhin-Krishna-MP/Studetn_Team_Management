const jwt = require('jsonwebtoken');
const { Student, Tutor } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if student or tutor
    if (decoded.role === 'student') {
      const student = await Student.findByPk(decoded.id);
      if (!student) {
        return res.status(401).json({
          success: false,
          message: 'Student not found'
        });
      }
      req.user = {
        id: student.student_id,
        email: student.email,
        name: student.name,
        role: 'student',
        batch_id: student.batch_id
      };
    } else if (decoded.role === 'tutor') {
      const tutor = await Tutor.findByPk(decoded.id);
      if (!tutor) {
        return res.status(401).json({
          success: false,
          message: 'Tutor not found'
        });
      }
      req.user = {
        id: tutor.tutor_id,
        email: tutor.email,
        name: tutor.name,
        role: 'tutor',
        department: tutor.department
      };
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid role'
      });
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Check if user is a tutor
 */
const isTutor = (req, res, next) => {
  if (req.user?.role !== 'tutor') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Tutor access required.'
    });
  }
  next();
};

/**
 * Check if user is a student
 */
const isStudent = (req, res, next) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student access required.'
    });
  }
  next();
};

module.exports = {
  authenticate,
  isTutor,
  isStudent,
  JWT_SECRET
};
