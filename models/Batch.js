const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Batch = sequelize.define('Batch', {
  batch_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  branch: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  section: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'Batch'
});

module.exports = Batch;
