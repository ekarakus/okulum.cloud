const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const DutySchedule = sequelize.define('DutySchedule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  school_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  shift: { type: DataTypes.ENUM('morning', 'afternoon'), allowNull: false },
  effective_from: { type: DataTypes.DATEONLY, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'duty_schedule',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    // Ensure only one active per (school_id, shift). If this is set active, deactivate others in same scope.
    beforeSave: async (instance, options) => {
      if (instance.is_active) {
        const { DutySchedule } = require('./relations');
        const where = {
          school_id: instance.school_id,
          shift: instance.shift,
          is_active: true
        };
        if (instance.id) {
          where.id = { [require('sequelize').Op.ne]: instance.id };
        }
        await DutySchedule.update(
          { is_active: false },
          { where, transaction: options.transaction }
        );
      }
    }
  }
});

module.exports = DutySchedule;
