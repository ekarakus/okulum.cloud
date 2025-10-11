const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const EmployeeType = sequelize.define('EmployeeType', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  is_teacher: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_principal: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_vice_principal: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'employee_types',
  timestamps: false
});

module.exports = EmployeeType;
