const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Operation = sequelize.define('Operation', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  device_id: { type: DataTypes.INTEGER, allowNull: false },
  operation_type_id: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.TEXT },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  technician_id: { type: DataTypes.INTEGER, allowNull: false },
  is_completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  school_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    comment: 'İşlemin ait olduğu okul',
    references: {
      model: 'schools',
      key: 'id'
    }
  },
  support_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'İlgili destek talebi (fault_reports.id) - nullable',
    references: {
      model: 'fault_reports',
      key: 'id'
    }
  },
  created_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },
  updated_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
}, {
  tableName: 'operations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Operation;
