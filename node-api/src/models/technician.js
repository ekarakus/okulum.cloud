const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Technician = sequelize.define('Technician', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
  school_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    comment: 'Teknisyenin ait olduğu okul',
    references: {
      model: 'schools',
      key: 'id'
    }
  },
}, {
  tableName: 'technicians',
  timestamps: false, // Sequelize timestamp'lerini kapat
});

module.exports = Technician;