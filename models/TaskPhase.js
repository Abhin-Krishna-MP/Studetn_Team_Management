const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskPhase = sequelize.define('Task_Phase', {
  phase_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tutor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tutor',
      key: 'tutor_id'
    }
  },
  batch_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Batch',
      key: 'batch_id'
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'Task_Phase'
});

module.exports = TaskPhase;
