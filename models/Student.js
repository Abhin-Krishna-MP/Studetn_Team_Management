const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Student = sequelize.define('Student', {
  student_id: {
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
    allowNull: true // Allow null for CSV imports
  },
  batch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Batch',
      key: 'batch_id'
    }
  }
}, {
  tableName: 'Student',
  hooks: {
    beforeCreate: async (student) => {
      if (student.password) {
        student.password = await bcrypt.hash(student.password, 10);
      }
    },
    beforeUpdate: async (student) => {
      if (student.changed('password') && student.password) {
        student.password = await bcrypt.hash(student.password, 10);
      }
    }
  }
});

Student.prototype.comparePassword = async function(password) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

module.exports = Student;
