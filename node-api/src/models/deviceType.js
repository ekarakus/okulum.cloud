const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const DeviceType = sequelize.define('DeviceType', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  device_code: { type: DataTypes.STRING(10), allowNull: false },
  description: { type: DataTypes.TEXT },
}, {
  tableName: 'device_types', // Manuel tablo adı belirtme
  timestamps: false,
});

module.exports = DeviceType;