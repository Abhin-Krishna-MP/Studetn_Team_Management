const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Submission = sequelize.define('Submission', {
  submission_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Team',
      key: 'team_id'
    }
  },
  phase_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Task_Phase',
      key: 'phase_id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  submission_text: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  ai_summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ai_similarity_flag: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  group_marks: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'Submission'
});

module.exports = Submission;
