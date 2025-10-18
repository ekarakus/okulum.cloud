const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const InfoNuggetCategory = sequelize.define('info_nugget_category', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  color_hex: { type: DataTypes.STRING(7), allowNull: true },
  visual_value: { type: DataTypes.STRING(255), allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  timestamps: false,
  tableName: 'info_nugget_categories'
});

module.exports = InfoNuggetCategory;
