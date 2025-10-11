const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const DeviceFeature = sequelize.define('DeviceFeature', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  device_id: { type: DataTypes.INTEGER, allowNull: false },
  feature_id: { type: DataTypes.INTEGER, allowNull: false },
  value: { type: DataTypes.STRING, allowNull: true, comment: 'Özellik değeri' }
}, {
  tableName: 'device_features',
  timestamps: false // Sequelize timestamp'lerini kapat
});

module.exports = DeviceFeature;