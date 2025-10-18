const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const InfoNugget = sequelize.define('info_nugget', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  title: { type: DataTypes.STRING(255), allowNull: true },
  text_content: { type: DataTypes.TEXT, allowNull: true },
  display_duration_ms: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10000 },
  priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  start_date: { type: DataTypes.DATEONLY, allowNull: true },
  expiration_date: { type: DataTypes.DATEONLY, allowNull: true },
  publish_start_time: { type: DataTypes.TIME, allowNull: true },
  publish_end_time: { type: DataTypes.TIME, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  timestamps: false,
  tableName: 'info_nuggets'
});

module.exports = InfoNugget;
