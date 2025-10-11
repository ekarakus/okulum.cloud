const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const UserPermission = sequelize.define('UserPermission', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_schools_id: { type: DataTypes.INTEGER, allowNull: false },
  permission_id: { type: DataTypes.INTEGER, allowNull: false },
  assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'user_permissions',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['user_schools_id', 'permission_id'] }
  ]
});

module.exports = UserPermission;
