const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Feature = sequelize.define('Feature', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  // Sort order (1,2,3...) - smaller number appears first
  sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'features',
  timestamps: false // Sequelize timestamp'lerini kapat
});

module.exports = Feature;