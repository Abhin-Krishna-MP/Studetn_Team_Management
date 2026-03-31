const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Tutor = sequelize.define('Tutor', {
  tutor_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'Tutor',
  hooks: {
    beforeCreate: async (tutor) => {
      if (tutor.password) {
        tutor.password = await bcrypt.hash(tutor.password, 10);
      }
    },
    beforeUpdate: async (tutor) => {
      if (tutor.changed('password') && tutor.password) {
        tutor.password = await bcrypt.hash(tutor.password, 10);
      }
    }
  }
});

Tutor.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = Tutor;
