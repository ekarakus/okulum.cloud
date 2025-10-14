const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const DutyScheduleAssignment = sequelize.define('DutyScheduleAssignment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  duty_schedule_id: { type: DataTypes.INTEGER, allowNull: false },
  day_of_week: { type: DataTypes.ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday'), allowNull: false },
  duty_location_id: { type: DataTypes.INTEGER, allowNull: true },
  school_employee_id: { type: DataTypes.INTEGER, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'duty_schedule_assignments',
  timestamps: false
});

module.exports = DutyScheduleAssignment;
