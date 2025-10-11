const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const School = sequelize.define('School', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false,
    comment: 'Okul adı'
  },
  code: { 
    type: DataTypes.STRING(10), 
    unique: true, 
    allowNull: false,
    comment: 'Okul kodu (örn: AKM001)'
  },
  created_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },
  updated_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
}, {
  tableName: 'schools',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = School;