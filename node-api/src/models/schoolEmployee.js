const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const SchoolEmployee = sequelize.define('SchoolEmployee', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  school_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: true },
  employee_type_id: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'school_employees',
  timestamps: false
});

module.exports = SchoolEmployee;
