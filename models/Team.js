const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Team = sequelize.define('Team', {
  team_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  team_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tutor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tutor',
      key: 'tutor_id'
    }
  }
}, {
  tableName: 'Team'
});

module.exports = Team;
