const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IndividualGrade = sequelize.define('Individual_Grade', {
  grade_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Student',
      key: 'student_id'
    }
  },
  submission_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Submission',
      key: 'submission_id'
    }
  },
  marks_awarded: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  tutor_feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'Individual_Grade'
});

module.exports = IndividualGrade;
