const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DraftCommit = sequelize.define('Draft_Commit', {
  commit_id: {
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
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  lines_added: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  lines_deleted: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  }
}, {
  tableName: 'Draft_Commit'
});

module.exports = DraftCommit;
