const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const District = sequelize.define('District', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  province_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'districts',
  timestamps: false
});

module.exports = District;
