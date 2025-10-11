const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const OperationType = sequelize.define('OperationType', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true }, // Global unique
  description: { type: DataTypes.TEXT },
}, {
  tableName: 'operation_types', // Manuel tablo adı belirtme
  timestamps: false, // Sequelize timestamp'lerini kapat
});

module.exports = OperationType;
