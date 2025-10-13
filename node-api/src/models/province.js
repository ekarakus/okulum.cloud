const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Province = sequelize.define('Province', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  // DB column is named 'ord' to avoid reserved word conflicts; map it to property 'order'
  order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'ord' }
}, {
  tableName: 'provinces',
  timestamps: false
});

module.exports = Province;
