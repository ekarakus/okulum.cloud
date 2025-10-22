const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const FaultReport = sequelize.define('FaultReport', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  school_id: { type: DataTypes.INTEGER, allowNull: false },
  device_id: { type: DataTypes.INTEGER, allowNull: false },
  created_by_user_id: { type: DataTypes.INTEGER, allowNull: false, comment: 'FK to users table - who created the fault report' },
  requested_by_employee_id: { type: DataTypes.INTEGER, allowNull: true, comment: 'Optional FK to school_employees table representing the requesting staff' },
  issue_details: { type: DataTypes.TEXT, allowNull: false },
  operation_id: { type: DataTypes.INTEGER, allowNull: true },
  image: { type: DataTypes.STRING, allowNull: true, comment: 'Optional image path or URL' },
  status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'fault_reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

// Associations are registered in relations.js to avoid circular requires

module.exports = FaultReport;
