const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeamMember = sequelize.define('Team_Member', {
  team_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Team',
      key: 'team_id'
    }
  },
  student_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Student',
      key: 'student_id'
    }
  }
}, {
  tableName: 'Team_Member'
});

module.exports = TeamMember;
